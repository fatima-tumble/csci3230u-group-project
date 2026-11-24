export const categories = ["Food", "Events", "Entertainment", "Activities"] as const;

export type Category = (typeof categories)[number];

export type CategoryFilter = Category | "All";

// OpenTripMap describes places with "kinds" (e.g. "museums,cultural,interesting_places").
// This maps those kinds onto the app's own categories.
const kindsByCategory: Record<Category, string[]> = {
  Food: ["foods", "restaurants", "cafes", "fast_food", "food_courts", "bars", "pubs", "biergartens", "marketplaces"],
  Events: ["stadiums", "concert_halls", "opera_houses", "festivals"],
  Entertainment: ["amusements", "theatres_and_entertainments", "cinemas", "amusement_parks", "water_parks", "ferris_wheels", "miniature_parks", "zoos", "aquariums", "nightclubs"],
  Activities: ["sport", "natural", "museums", "cultural", "historic", "architecture", "gardens_and_parks", "urban_environment", "beaches", "view_points", "climbing", "diving", "towers"],
};

export function categoriesFromKinds(kinds: string | undefined): Category[] {
  if (!kinds) return [];
  const placeKinds = new Set(kinds.split(",").map((k) => k.trim()));
  return categories.filter((category) => kindsByCategory[category].some((kind) => placeKinds.has(kind)));
}
