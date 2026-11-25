import { supabase } from "../lib/supabase";
import {
  PAGE_SIZE,
  followStatusFrom,
  type FollowRequest,
  type FollowStatus,
  type PopularPlace,
  type ProfileStats,
  type PublicProfile,
  type Visibility,
  type Visit,
} from "./social";

function client() {
  if (!supabase) throw new Error("Accounts aren't set up yet.");
  return supabase;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// Each visit comes back with its author and the people tagged in it
const VISIT_SELECT =
  "*, author:profiles!visits_user_id_fkey(username, display_name, avatar_url), companions:visit_companions(profile:profiles(username, display_name, avatar_url))";

function pageRange(page: number) {
  const from = page * PAGE_SIZE;
  return [from, from + PAGE_SIZE - 1] as const;
}

// Follows ---------------------------------------------------------------------------

export async function fetchFollowStatus(me: string, target: string): Promise<FollowStatus> {
  const { data, error } = await client()
    .from("follows").select("status").eq("follower_id", me).eq("following_id", target).maybeSingle();
  fail(error);
  return followStatusFrom(data);
}

export async function follow(me: string, target: string): Promise<FollowStatus> {
  const { data, error } = await client()
    .from("follows").insert({ follower_id: me, following_id: target }).select("status").single();
  fail(error);
  return followStatusFrom(data);
}

export async function unfollow(me: string, target: string) {
  const { error } = await client().from("follows").delete().eq("follower_id", me).eq("following_id", target);
  fail(error);
}

export async function fetchFollowRequests(me: string): Promise<FollowRequest[]> {
  const { data, error } = await client()
    .from("follows")
    .select("follower_id, created_at, follower:profiles!follows_follower_id_fkey(id, username, display_name, avatar_url)")
    .eq("following_id", me)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []) as unknown as FollowRequest[];
}

export async function acceptFollowRequest(me: string, followerId: string) {
  const { error } = await client()
    .from("follows").update({ status: "accepted" }).eq("following_id", me).eq("follower_id", followerId);
  fail(error);
}

export async function declineFollowRequest(me: string, followerId: string) {
  const { error } = await client().from("follows").delete().eq("following_id", me).eq("follower_id", followerId);
  fail(error);
}

// People the user follows (approved). Used for "visited with" tags.
export async function fetchFollowing(me: string): Promise<(PublicProfile & { id: string })[]> {
  const { data, error } = await client()
    .from("follows")
    .select("profile:profiles!follows_following_id_fkey(id, username, display_name, avatar_url)")
    .eq("follower_id", me)
    .eq("status", "accepted");
  fail(error);
  return ((data ?? []) as unknown as { profile: PublicProfile & { id: string } }[])
    .map((row) => row.profile)
    .filter(Boolean)
    .sort((a, b) => a.username.localeCompare(b.username));
}

export async function fetchProfileStats(profileId: string): Promise<ProfileStats> {
  const { data, error } = await client().rpc("profile_stats", { profile_id: profileId }).single();
  fail(error);
  const row = data as { visits: number; followers: number; following: number };
  return { visits: Number(row.visits), followers: Number(row.followers), following: Number(row.following) };
}

export async function setAccountPrivate(me: string, isPrivate: boolean) {
  const { error } = await client().from("profiles").update({ is_private: isPrivate }).eq("id", me);
  fail(error);
}

// Visits ----------------------------------------------------------------------------

export async function fetchUserVisits(userId: string, page = 0): Promise<Visit[]> {
  const { data, error } = await client()
    .from("visits").select(VISIT_SELECT).eq("user_id", userId)
    .order("created_at", { ascending: false }).range(...pageRange(page));
  fail(error);
  return (data ?? []) as Visit[];
}

// Friends feed: posts from people the user follows, newest first
export async function fetchFriendsFeed(me: string, page = 0): Promise<Visit[]> {
  const { data: rows, error: followError } = await client()
    .from("follows").select("following_id").eq("follower_id", me).eq("status", "accepted");
  fail(followError);
  const ids = (rows ?? []).map((r) => r.following_id as string);
  if (ids.length === 0) return [];
  const { data, error } = await client()
    .from("visits").select(VISIT_SELECT).in("user_id", ids)
    .order("created_at", { ascending: false }).range(...pageRange(page));
  fail(error);
  return (data ?? []) as Visit[];
}

export async function fetchPublicVisits(page = 0): Promise<Visit[]> {
  const { data, error } = await client()
    .from("visits").select(VISIT_SELECT).eq("visibility", "public")
    .order("created_at", { ascending: false }).range(...pageRange(page));
  fail(error);
  return (data ?? []) as Visit[];
}

export async function fetchPopularPlaces(): Promise<PopularPlace[]> {
  const { data, error } = await client().rpc("popular_places", { days: 30, max_results: 8 });
  fail(error);
  return ((data ?? []) as PopularPlace[]).map((p) => ({ ...p, visit_count: Number(p.visit_count), avg_rating: Number(p.avg_rating) }));
}

export type NewVisit = {
  xid: string
  placeName: string
  placeImage?: string | null
  rating: number
  visitedOn: string
  blurb: string
  visibility: Visibility
  photos: File[]
  companionIds: string[]
}

async function uploadVisitPhotos(userId: string, files: File[]): Promise<string[]> {
  const storage = client().storage.from("visit-photos");
  return Promise.all(files.map(async (file) => {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await storage.upload(path, file, { contentType: file.type });
    fail(error);
    return storage.getPublicUrl(path).data.publicUrl;
  }));
}

export async function createVisit(userId: string, input: NewVisit): Promise<string> {
  const photos = await uploadVisitPhotos(userId, input.photos);
  const { data, error } = await client()
    .from("visits")
    .insert({
      user_id: userId,
      xid: input.xid,
      place_name: input.placeName,
      place_image: input.placeImage ?? null,
      rating: input.rating,
      visited_on: input.visitedOn,
      blurb: input.blurb.trim() || null,
      photos,
      visibility: input.visibility,
    })
    .select("id")
    .single();
  fail(error);
  const visitId = (data as { id: string }).id;
  if (input.companionIds.length) {
    const { error: tagError } = await client()
      .from("visit_companions")
      .insert(input.companionIds.map((id) => ({ visit_id: visitId, user_id: id })));
    fail(tagError);
  }
  return visitId;
}

function storagePathFromUrl(url: string) {
  const marker = "/visit-photos/";
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

export async function deleteVisit(visit: Pick<Visit, "id" | "photos">) {
  const paths = visit.photos.map(storagePathFromUrl).filter((p): p is string => Boolean(p));
  if (paths.length) await client().storage.from("visit-photos").remove(paths);
  const { error } = await client().from("visits").delete().eq("id", visit.id);
  fail(error);
}

export async function removeMyTag(me: string, visitId: string) {
  const { error } = await client().from("visit_companions").delete().eq("visit_id", visitId).eq("user_id", me);
  fail(error);
}
