import { createSearchParams } from "react-router";
import type { Category } from "./categories";

export type HomeSearchInput = {
  mode: "location" | "name"
  name: string
  city: string
  region: string
  country: string
  category?: Category | null
}

// Builds the /results query string from the home page search fields. Used by both the
// Search button and the category tags, so a tag keeps whatever location you've typed.
export function resultsSearchFor(input: HomeSearchInput): string {
  const search = createSearchParams();
  if (input.mode === "name") {
    const n = input.name.trim();
    if (n) search.set("name", n);
  } else {
    const q = [input.city, input.region, input.country].map((p) => p.trim()).filter(Boolean).join(", ");
    if (q) search.set("q", q);
  }
  if (input.category) search.set("category", input.category);
  return search.toString();
}
