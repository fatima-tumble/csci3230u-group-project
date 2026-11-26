import type { MockPlace } from "./places";
import { categories, type CategoryFilter } from "./categories";

export type SortKey = "distance-asc" | "distance-desc" | "name-asc" | "name-desc";

export const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "distance-asc", label: "Closest first" },
  { value: "distance-desc", label: "Farthest first" },
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
];

export function readCategoryParam(raw: string | null): CategoryFilter {
  if (!raw) return "All";
  const match = (categories as readonly string[]).find((c) => c.toLowerCase() === raw.toLowerCase());
  return (match as CategoryFilter) ?? "All";
}

export function readPageParam(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function readSortParam(raw: string | null): SortKey {
  return (SORT_OPTIONS.find((o) => o.value === raw)?.value) ?? "distance-asc";
}

export function sortPlaces(places: MockPlace[], sort: SortKey): MockPlace[] {
  const copy = [...places];
  switch (sort) {
    case "distance-desc": return copy.sort((a, b) => b.distanceKm - a.distanceKm);
    case "name-asc":      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":     return copy.sort((a, b) => b.name.localeCompare(a.name));
    default:              return copy.sort((a, b) => a.distanceKm - b.distanceKm);
  }
}

export type Pagination<T> = {
  page: number;
  pageCount: number;
  items: T[];
};

export function paginate<T>(items: T[], requestedPage: number, pageSize: number): Pagination<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const slice = items.slice((page - 1) * pageSize, page * pageSize);
  return { page, pageCount, items: slice };
}
