-- #34 Social: follows, visits (rating, blurb, photos, visited-with tags), feed + explore
-- Requires 0001_profiles.sql. Safe to re-run.

-- Helpers used inside access rules live in a schema the API doesn't expose,
-- so they can't be called directly at /rest/v1/rpc/...
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- Private accounts: posts only reach approved followers, and following needs approval
alter table public.profiles add column if not exists is_private boolean not null default false;

-- Follows ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx on public.follows (following_id, status);

-- The server decides the status: open accounts are followed straight away, private ones get a request.
-- (Clients can't skip the approval by sending status = 'accepted'.)
create or replace function public.set_follow_status()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.status := case
    when (select is_private from public.profiles where id = new.following_id) then 'pending'
    else 'accepted'
  end;
  return new;
end;
$$;

revoke execute on function public.set_follow_status() from public, anon, authenticated;

drop trigger if exists before_follow_insert on public.follows;
create trigger before_follow_insert
  before insert on public.follows
  for each row execute function public.set_follow_status();

-- Making an account public approves everyone who was waiting
create or replace function public.accept_pending_when_public()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if old.is_private and not new.is_private then
    update public.follows set status = 'accepted' where following_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;

revoke execute on function public.accept_pending_when_public() from public, anon, authenticated;

drop trigger if exists after_profile_privacy_change on public.profiles;
create trigger after_profile_privacy_change
  after update of is_private on public.profiles
  for each row execute function public.accept_pending_when_public();

alter table public.follows enable row level security;

drop policy if exists "Accepted follows are public; requests visible to both people" on public.follows;
create policy "Accepted follows are public; requests visible to both people"
  on public.follows for select
  using (status = 'accepted' or auth.uid() in (follower_id, following_id));

drop policy if exists "Users follow as themselves" on public.follows;
create policy "Users follow as themselves"
  on public.follows for insert to authenticated
  with check (follower_id = auth.uid());

drop policy if exists "Users approve requests sent to them" on public.follows;
create policy "Users approve requests sent to them"
  on public.follows for update to authenticated
  using (following_id = auth.uid())
  with check (following_id = auth.uid() and status = 'accepted');

drop policy if exists "Either person can end a follow" on public.follows;
create policy "Either person can end a follow"
  on public.follows for delete to authenticated
  using (auth.uid() in (follower_id, following_id));

-- Is the current user an approved follower of this person?
create or replace function private.is_following(target uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.follows
    where follower_id = auth.uid() and following_id = target and status = 'accepted'
  );
$$;

-- Visits ----------------------------------------------------------------------------
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  xid text not null,
  place_name text not null check (char_length(place_name) <= 200),
  place_image text,
  rating smallint not null check (rating between 1 and 10),
  visited_on date not null default current_date,
  blurb text check (char_length(blurb) <= 280),
  photos text[] not null default '{}' check (cardinality(photos) <= 4),
  visibility text not null default 'followers' check (visibility in ('followers', 'public')),
  created_at timestamptz not null default now()
);

create index if not exists visits_user_created_idx on public.visits (user_id, created_at desc);
create index if not exists visits_public_created_idx on public.visits (created_at desc) where visibility = 'public';
create index if not exists visits_xid_idx on public.visits (xid);

-- Who can see a visit: its author, the author's approved followers,
-- and everyone if it's marked public and the author's account isn't private
create or replace function private.can_view_visit(author uuid, visibility text)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select author = auth.uid()
    or private.is_following(author)
    or (visibility = 'public' and not coalesce((select is_private from public.profiles where id = author), true));
$$;

alter table public.visits enable row level security;

drop policy if exists "Visits follow their author's privacy" on public.visits;
create policy "Visits follow their author's privacy"
  on public.visits for select
  using (private.can_view_visit(user_id, visibility));

drop policy if exists "Users post their own visits" on public.visits;
create policy "Users post their own visits"
  on public.visits for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users edit their own visits" on public.visits;
create policy "Users edit their own visits"
  on public.visits for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete their own visits" on public.visits;
create policy "Users delete their own visits"
  on public.visits for delete to authenticated
  using (user_id = auth.uid());

-- "Visited with" tags ---------------------------------------------------------------
create table if not exists public.visit_companions (
  visit_id uuid not null references public.visits (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (visit_id, user_id)
);

alter table public.visit_companions enable row level security;

-- Was the current user tagged in this visit? (security definer avoids a policy loop between the two tables)
create or replace function private.is_tagged_in(visit uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.visit_companions where visit_id = visit and user_id = auth.uid());
$$;

-- People can always see visits they were tagged in, so they can find and remove the tag
drop policy if exists "Tagged people can see visits they're in" on public.visits;
create policy "Tagged people can see visits they're in"
  on public.visits for select to authenticated
  using (private.is_tagged_in(id));

drop policy if exists "Tags are visible with their visit" on public.visit_companions;
create policy "Tags are visible with their visit"
  on public.visit_companions for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.visits v
      where v.id = visit_id and private.can_view_visit(v.user_id, v.visibility)
    )
  );

-- You can only tag people who you follow (approved), on your own visits
drop policy if exists "Authors tag people they follow" on public.visit_companions;
create policy "Authors tag people they follow"
  on public.visit_companions for insert to authenticated
  with check (
    exists (select 1 from public.visits v where v.id = visit_id and v.user_id = auth.uid())
    and private.is_following(user_id)
  );

-- The author can remove a tag, and so can the person who was tagged
drop policy if exists "Author or tagged person can remove a tag" on public.visit_companions;
create policy "Author or tagged person can remove a tag"
  on public.visit_companions for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.visits v where v.id = visit_id and v.user_id = auth.uid())
  );

-- Profile counts (follower/following/visit numbers are public, like most social apps)
create or replace function public.profile_stats(profile_id uuid)
returns table (visits bigint, followers bigint, following bigint)
language sql
stable
security definer set search_path = ''
as $$
  select
    (select count(*) from public.visits where user_id = profile_id),
    (select count(*) from public.follows where following_id = profile_id and status = 'accepted'),
    (select count(*) from public.follows where follower_id = profile_id and status = 'accepted');
$$;

grant execute on function public.profile_stats(uuid) to anon, authenticated;

-- Explore: most-visited places in public posts over the last N days
create or replace function public.popular_places(days integer default 30, max_results integer default 8)
returns table (xid text, place_name text, place_image text, visit_count bigint, avg_rating numeric)
language sql
stable
security definer set search_path = ''
as $$
  select v.xid,
         (array_agg(v.place_name order by v.created_at desc))[1],
         (array_agg(v.place_image order by v.created_at desc) filter (where v.place_image is not null))[1],
         count(*),
         round(avg(v.rating), 1)
  from public.visits v
  join public.profiles p on p.id = v.user_id
  where v.visibility = 'public'
    and not p.is_private
    and v.created_at > now() - make_interval(days => days)
  group by v.xid
  order by count(*) desc, avg(v.rating) desc
  limit max_results;
$$;

grant execute on function public.popular_places(integer, integer) to anon, authenticated;

-- Visit photos: public bucket, users write only inside their own folder.
-- (Paths include random ids, so photo URLs can't be guessed.)
insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', true)
on conflict (id) do nothing;

-- Storage needs a select rule to remove files
drop policy if exists "Users see their own visit photo files" on storage.objects;
create policy "Users see their own visit photo files"
  on storage.objects for select to authenticated
  using (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload their own visit photos" on storage.objects;
create policy "Users upload their own visit photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own visit photos" on storage.objects;
create policy "Users delete their own visit photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Earlier versions of this file put the helpers in public; remove those copies
drop function if exists public.is_following(uuid);
drop function if exists public.can_view_visit(uuid, text);
drop function if exists public.is_tagged_in(uuid);
