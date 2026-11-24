import type { Profile } from "./profile";

export const MAX_BLURB = 280;
export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PAGE_SIZE = 10;

export type PublicProfile = Pick<Profile, "username" | "display_name" | "avatar_url">
export type Visibility = "followers" | "public"

export type Visit = {
  id: string
  user_id: string
  xid: string
  place_name: string
  place_image: string | null
  rating: number
  visited_on: string
  blurb: string | null
  photos: string[]
  visibility: Visibility
  created_at: string
  author: PublicProfile | null
  companions: { profile: PublicProfile | null }[]
}

export type FollowStatus = "none" | "pending" | "following";

export type FollowRequest = {
  follower_id: string
  created_at: string
  follower: (PublicProfile & { id: string }) | null
}

export type PopularPlace = {
  xid: string
  place_name: string
  place_image: string | null
  visit_count: number
  avg_rating: number
}

export type ProfileStats = { visits: number; followers: number; following: number }

export type VisitDraft = {
  rating: number | null
  visitedOn: string
  blurb: string
  photos: File[]
}

// Local date as YYYY-MM-DD (toISOString would use UTC and can be off by a day)
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function validateVisit(draft: VisitDraft, today = todayISO()) {
  const errors: Partial<Record<keyof VisitDraft, string>> = {};
  if (draft.rating === null) errors.rating = "Pick a rating from 1 to 10.";
  else if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 10) errors.rating = "Ratings go from 1 to 10.";
  if (!draft.visitedOn) errors.visitedOn = "When did you go?";
  else if (draft.visitedOn > today) errors.visitedOn = "That date is in the future.";
  if (draft.blurb.length > MAX_BLURB) errors.blurb = `Keep it to ${MAX_BLURB} characters.`;
  if (draft.photos.length > MAX_PHOTOS) errors.photos = `Add up to ${MAX_PHOTOS} photos.`;
  else if (draft.photos.some((f) => !f.type.startsWith("image/"))) errors.photos = "Photos must be images.";
  else if (draft.photos.some((f) => f.size > MAX_PHOTO_BYTES)) errors.photos = "Each photo must be 5 MB or smaller.";
  return errors;
}

export function followStatusFrom(row: { status: string } | null | undefined): FollowStatus {
  if (!row) return "none";
  return row.status === "accepted" ? "following" : "pending";
}

// Mirrors the database rule, so the UI can explain why posts are hidden
export function canSeePosts(opts: { isOwnProfile: boolean; isPrivate: boolean; followStatus: FollowStatus }) {
  return opts.isOwnProfile || !opts.isPrivate || opts.followStatus === "following";
}

export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatVisitDate(isoDate: string) {
  // Dates are stored as plain YYYY-MM-DD; parse as local so the day doesn't shift
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
