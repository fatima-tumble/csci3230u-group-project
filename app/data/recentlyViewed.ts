import { categories, type Category } from "./categories";

export const RECENTLY_VIEWED_KEY = "wander:recently-viewed";
export const MAX_RECENTLY_VIEWED = 10;

export type RecentlyViewedPlace = {
  xid: string
  name: string
  image?: string
  categories: Category[]
  viewedAt: number
}

// Adds a place to the front of the list. Viewing a place again moves it back to the front
// instead of adding a duplicate, and the list is capped so storage doesn't grow forever.
export function addRecentlyViewed(
  list: RecentlyViewedPlace[],
  place: RecentlyViewedPlace,
  max = MAX_RECENTLY_VIEWED,
): RecentlyViewedPlace[] {
  return [place, ...list.filter((p) => p.xid !== place.xid)].slice(0, max);
}

function isCategory(value: unknown): value is Category {
  return (categories as readonly unknown[]).includes(value);
}

function isRecentlyViewedPlace(value: unknown): value is RecentlyViewedPlace {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.xid === "string" &&
    typeof v.name === "string" &&
    typeof v.viewedAt === "number" &&
    (v.image === undefined || typeof v.image === "string") &&
    Array.isArray(v.categories) &&
    v.categories.every(isCategory)
  );
}

// Reads whatever is in storage defensively: missing, corrupted or hand-edited values
// fall back to an empty list instead of crashing the page.
export function parseRecentlyViewed(raw: string | null): RecentlyViewedPlace[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentlyViewedPlace).slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
}

// Suggests the categories that show up most in the user's history.
// Ties go to the category that was viewed most recently.
export function suggestCategories(list: RecentlyViewedPlace[], limit = 2): Category[] {
  const counts = new Map<Category, { count: number; lastSeen: number }>();
  list.forEach((place, index) => {
    for (const category of place.categories) {
      const entry = counts.get(category);
      if (entry) entry.count += 1;
      else counts.set(category, { count: 1, lastSeen: index });
    }
  });
  return [...counts.entries()]
    .sort(([, a], [, b]) => b.count - a.count || a.lastSeen - b.lastSeen)
    .slice(0, limit)
    .map(([category]) => category);
}
