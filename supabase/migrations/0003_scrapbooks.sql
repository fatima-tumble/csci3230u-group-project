-- #35 Scrapbooks: drag-and-drop pages of stickers, text and place photos
-- Requires 0001_profiles.sql. Safe to re-run.

create table if not exists public.scrapbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null default 'Untitled scrapbook' check (char_length(title) between 1 and 80),
  -- The page layout (background + items) as JSON; the app validates the shape when reading it
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 500000),
  thumbnail_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scrapbooks_user_updated_idx on public.scrapbooks (user_id, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.touch_updated_at() from public, anon, authenticated;

drop trigger if exists scrapbooks_touch_updated_at on public.scrapbooks;
create trigger scrapbooks_touch_updated_at
  before update on public.scrapbooks
  for each row execute function public.touch_updated_at();

alter table public.scrapbooks enable row level security;

drop policy if exists "Owners see their scrapbooks; public ones are visible to all" on public.scrapbooks;
create policy "Owners see their scrapbooks; public ones are visible to all"
  on public.scrapbooks for select
  using (is_public or user_id = auth.uid());

drop policy if exists "Users create their own scrapbooks" on public.scrapbooks;
create policy "Users create their own scrapbooks"
  on public.scrapbooks for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users edit their own scrapbooks" on public.scrapbooks;
create policy "Users edit their own scrapbooks"
  on public.scrapbooks for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users delete their own scrapbooks" on public.scrapbooks;
create policy "Users delete their own scrapbooks"
  on public.scrapbooks for delete to authenticated
  using (user_id = auth.uid());

-- Small preview images for the scrapbook list
insert into storage.buckets (id, name, public)
values ('scrapbook-thumbnails', 'scrapbook-thumbnails', true)
on conflict (id) do nothing;

-- Storage needs a select rule to replace (upsert) or remove files
drop policy if exists "Users see their own scrapbook thumbnails" on storage.objects;
create policy "Users see their own scrapbook thumbnails"
  on storage.objects for select to authenticated
  using (bucket_id = 'scrapbook-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload their own scrapbook thumbnails" on storage.objects;
create policy "Users upload their own scrapbook thumbnails"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'scrapbook-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users replace their own scrapbook thumbnails" on storage.objects;
create policy "Users replace their own scrapbook thumbnails"
  on storage.objects for update to authenticated
  using (bucket_id = 'scrapbook-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own scrapbook thumbnails" on storage.objects;
create policy "Users delete their own scrapbook thumbnails"
  on storage.objects for delete to authenticated
  using (bucket_id = 'scrapbook-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
