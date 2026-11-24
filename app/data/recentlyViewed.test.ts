import { describe, expect, it } from "vitest";
import {
  MAX_RECENTLY_VIEWED,
  addRecentlyViewed,
  parseRecentlyViewed,
  suggestCategories,
  type RecentlyViewedPlace,
} from "./recentlyViewed";
import { categoriesFromKinds, type Category } from "./categories";

function place(xid: string, categories: Category[] = [], viewedAt = 0): RecentlyViewedPlace {
  return { xid, name: `Place ${xid}`, categories, viewedAt };
}

describe("addRecentlyViewed", () => {
  it("puts the newest place first", () => {
    const list = addRecentlyViewed([place("a")], place("b"));
    expect(list.map((p) => p.xid)).toEqual(["b", "a"]);
  });

  it("moves a place viewed again to the front instead of duplicating it", () => {
    const list = addRecentlyViewed([place("a"), place("b"), place("c")], place("c"));
    expect(list.map((p) => p.xid)).toEqual(["c", "a", "b"]);
  });

  it("caps the list length", () => {
    let list: RecentlyViewedPlace[] = [];
    for (let i = 0; i < MAX_RECENTLY_VIEWED + 5; i++) list = addRecentlyViewed(list, place(String(i)));
    expect(list).toHaveLength(MAX_RECENTLY_VIEWED);
    expect(list[0].xid).toBe(String(MAX_RECENTLY_VIEWED + 4));
  });

  it("does not mutate the original list", () => {
    const original = [place("a")];
    addRecentlyViewed(original, place("b"));
    expect(original).toHaveLength(1);
  });
});

describe("parseRecentlyViewed", () => {
  it("returns an empty list for missing or corrupted data", () => {
    expect(parseRecentlyViewed(null)).toEqual([]);
    expect(parseRecentlyViewed("not json")).toEqual([]);
    expect(parseRecentlyViewed('{"xid":"a"}')).toEqual([]);
  });

  it("keeps valid entries and drops invalid ones", () => {
    const raw = JSON.stringify([place("a", ["Food"]), { xid: "b" }, place("c", ["Nope" as Category])]);
    expect(parseRecentlyViewed(raw).map((p) => p.xid)).toEqual(["a"]);
  });
});

describe("suggestCategories", () => {
  it("returns nothing when there is no history", () => {
    expect(suggestCategories([])).toEqual([]);
  });

  it("ranks categories by how often they were viewed", () => {
    const list = [place("1", ["Food"]), place("2", ["Activities"]), place("3", ["Activities", "Food"]), place("4", ["Activities"])];
    expect(suggestCategories(list)).toEqual(["Activities", "Food"]);
  });

  it("breaks ties with the most recently viewed category", () => {
    const list = [place("1", ["Events"]), place("2", ["Food"])];
    expect(suggestCategories(list, 1)).toEqual(["Events"]);
  });
});

describe("categoriesFromKinds", () => {
  it("maps OpenTripMap kinds onto app categories", () => {
    expect(categoriesFromKinds("museums,cultural,interesting_places")).toEqual(["Activities"]);
    expect(categoriesFromKinds("restaurants,foods,interesting_places")).toEqual(["Food"]);
    expect(categoriesFromKinds("stadiums,sport,amusements")).toEqual(["Events", "Entertainment", "Activities"]);
  });

  it("returns nothing for unknown or missing kinds", () => {
    expect(categoriesFromKinds("banks,transport")).toEqual([]);
    expect(categoriesFromKinds(undefined)).toEqual([]);
  });
});
