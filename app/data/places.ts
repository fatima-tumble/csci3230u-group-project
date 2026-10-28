import placesData from "./places.json";
import type { Category, CategoryFilter } from "./categories";

export type MockPlace = {
    xid: string
    name: string
    description: string
    distanceKm: number
    categories: Category[]
    image?: string
}

export const mockPlaces = placesData as MockPlace[];

export function filterPlacesByCategory<T extends { categories: Category[] }>(places: T[], category: CategoryFilter): T[] {
  if (category === "All") return places;
  return places.filter((place) => place.categories.includes(category));
}
