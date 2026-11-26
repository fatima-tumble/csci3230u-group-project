import { describe, expect, it } from "vitest";
import { resultsSearchFor, type HomeSearchInput } from "./homeSearch";

const empty: HomeSearchInput = { mode: "location", name: "", city: "" };

describe("resultsSearchFor", () => {
  it("links a category tag straight to that category", () => {
    expect(resultsSearchFor({ ...empty, category: "Food" })).toBe("category=Food");
  });

  it("keeps the city typed on home when a tag is clicked", () => {
    const search = new URLSearchParams(resultsSearchFor({ ...empty, city: " Toronto ", category: "Events" }));
    expect(search.get("q")).toBe("Toronto");
    expect(search.get("category")).toBe("Events");
  });

  it("uses the name search in name mode and ignores the city", () => {
    const search = new URLSearchParams(resultsSearchFor({ ...empty, mode: "name", name: "CN Tower", city: "Ottawa" }));
    expect(search.get("name")).toBe("CN Tower");
    expect(search.has("q")).toBe(false);
  });

  it("returns an empty query when nothing is filled in", () => {
    expect(resultsSearchFor(empty)).toBe("");
  });
});
