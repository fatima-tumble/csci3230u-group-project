export const categories = ["Food", "Events", "Entertainment", "Activities"] as const;

export type Category = (typeof categories)[number];

export type CategoryFilter = Category | "All";

// OpenTripMap describes places with "kinds" (e.g. "museums,cultural,interesting_places").
// These two tables are the only place that maps kinds onto the app's categories, so the
// results filter, result card tags and "Recently viewed" / suggestions always agree.

// Kinds sent to OpenTripMap when filtering results by a category
export const CATEGORY_TO_KINDS: Record<Category, string> = {
  Food: "foods",
  Events: "theatres_and_entertainments,cultural",
  Entertainment: "amusements,theatres_and_entertainments,cinemas",
  Activities: "sport,natural,interesting_places",
};

// Which categories a place belongs to, based on its kinds
const KIND_TO_CATEGORY: Array<[RegExp, Category]> = [
  [/foods/, "Food"],
  [/amusements|cinemas|nightclubs/, "Entertainment"],
  [/theatres_and_entertainments|cultural|museums|historic/, "Events"],
  [/sport|natural|interesting_places|other/, "Activities"],
];

export function categoriesFromKinds(kinds: string | undefined): Category[] {
  const found = new Set<Category>();
  for (const [re, cat] of KIND_TO_CATEGORY) {
    if (kinds && re.test(kinds)) found.add(cat);
  }
  // Places that match nothing are treated as general activities
  if (found.size === 0) found.add("Activities");
  // Match order matters: result cards show the first category as the main one
  return Array.from(found);
}
