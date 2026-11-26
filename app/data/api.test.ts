import { describe, it, expect } from "vitest";
import { mapKindsToCategories, normalizeThumb } from "./api";

describe("mapKindsToCategories", () => {
  it("maps foods → Food", () => {
    expect(mapKindsToCategories("foods,restaurants")).toContain("Food");
  });

  it("maps cultural/historic to Events", () => {
    expect(mapKindsToCategories("cultural,museums")).toContain("Events");
    expect(mapKindsToCategories("historic")).toContain("Events");
  });

  it("maps amusements and cinemas to Entertainment", () => {
    expect(mapKindsToCategories("amusements")).toContain("Entertainment");
    expect(mapKindsToCategories("cinemas")).toContain("Entertainment");
  });

  it("maps sport/natural/interesting_places to Activities", () => {
    expect(mapKindsToCategories("sport")).toContain("Activities");
    expect(mapKindsToCategories("natural,beaches")).toContain("Activities");
  });

  it("can tag a place with multiple categories", () => {
    const cats = mapKindsToCategories("foods,cultural,historic");
    expect(cats).toEqual(expect.arrayContaining(["Food", "Events"]));
  });

  it("falls back to Activities when nothing matches", () => {
    expect(mapKindsToCategories("brand_new_category")).toEqual(["Activities"]);
  });

  it("dedupes repeated matches", () => {
    const cats = mapKindsToCategories("cultural,museums,historic");
    expect(cats.filter((c) => c === "Events")).toHaveLength(1);
  });
});

describe("normalizeThumb", () => {
  it("passes undefined through", () => {
    expect(normalizeThumb(undefined)).toBeUndefined();
  });

  it("rewrites a wikimedia 400px thumb to 960px", () => {
    const src = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/X.jpg/400px-X.jpg";
    expect(normalizeThumb(src)).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/X.jpg/960px-X.jpg",
    );
  });

  it("rewrites any pixel size, not just 400", () => {
    const src = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/23/X.jpg/640px-X.jpg";
    expect(normalizeThumb(src)).toContain("/960px-");
  });

  it("leaves urls without a thumb size unchanged", () => {
    const src = "https://example.com/plain.jpg";
    expect(normalizeThumb(src)).toBe(src);
  });
});
