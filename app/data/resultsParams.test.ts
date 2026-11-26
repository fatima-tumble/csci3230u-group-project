import { describe, it, expect } from "vitest";
import {
  readCategoryParam,
  readPageParam,
  readSortParam,
  sortPlaces,
  paginate,
} from "./resultsParams";
import type { MockPlace } from "./places";

function place(overrides: Partial<MockPlace>): MockPlace {
  return {
    xid: "x",
    name: "x",
    description: "",
    distanceKm: 0,
    categories: ["Activities"],
    ...overrides,
  };
}

describe("readCategoryParam", () => {
  it("returns All when missing or empty", () => {
    expect(readCategoryParam(null)).toBe("All");
    expect(readCategoryParam("")).toBe("All");
  });

  it("matches a known category case-insensitively", () => {
    expect(readCategoryParam("Food")).toBe("Food");
    expect(readCategoryParam("food")).toBe("Food");
    expect(readCategoryParam("ENTERTAINMENT")).toBe("Entertainment");
  });

  it("falls back to All for unknown values", () => {
    expect(readCategoryParam("coffee")).toBe("All");
  });
});

describe("readPageParam", () => {
  it("defaults to 1", () => {
    expect(readPageParam(null)).toBe(1);
    expect(readPageParam("")).toBe(1);
    expect(readPageParam("abc")).toBe(1);
  });

  it("parses positive integers", () => {
    expect(readPageParam("1")).toBe(1);
    expect(readPageParam("3")).toBe(3);
    expect(readPageParam("42")).toBe(42);
  });

  it("rejects zero and negatives", () => {
    expect(readPageParam("0")).toBe(1);
    expect(readPageParam("-2")).toBe(1);
  });
});

describe("readSortParam", () => {
  it("defaults to distance-asc", () => {
    expect(readSortParam(null)).toBe("distance-asc");
    expect(readSortParam("")).toBe("distance-asc");
    expect(readSortParam("made-up")).toBe("distance-asc");
  });

  it("accepts each known key", () => {
    expect(readSortParam("distance-asc")).toBe("distance-asc");
    expect(readSortParam("distance-desc")).toBe("distance-desc");
    expect(readSortParam("name-asc")).toBe("name-asc");
    expect(readSortParam("name-desc")).toBe("name-desc");
  });
});

describe("sortPlaces", () => {
  const places = [
    place({ xid: "c", name: "Cafe", distanceKm: 1.2 }),
    place({ xid: "a", name: "Aquarium", distanceKm: 5.0 }),
    place({ xid: "b", name: "Bakery", distanceKm: 0.5 }),
  ];

  it("closest first by default", () => {
    expect(sortPlaces(places, "distance-asc").map((p) => p.xid)).toEqual(["b", "c", "a"]);
  });

  it("farthest first", () => {
    expect(sortPlaces(places, "distance-desc").map((p) => p.xid)).toEqual(["a", "c", "b"]);
  });

  it("name A to Z", () => {
    expect(sortPlaces(places, "name-asc").map((p) => p.name)).toEqual(["Aquarium", "Bakery", "Cafe"]);
  });

  it("name Z to A", () => {
    expect(sortPlaces(places, "name-desc").map((p) => p.name)).toEqual(["Cafe", "Bakery", "Aquarium"]);
  });

  it("does not mutate the input", () => {
    const original = [...places];
    sortPlaces(places, "name-asc");
    expect(places).toEqual(original);
  });

  it("sorts stably enough that items with the same distance keep order among themselves", () => {
    const same = [
      place({ xid: "a", name: "A", distanceKm: 1 }),
      place({ xid: "b", name: "B", distanceKm: 1 }),
      place({ xid: "c", name: "C", distanceKm: 1 }),
    ];
    expect(sortPlaces(same, "distance-asc").map((p) => p.xid)).toEqual(["a", "b", "c"]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("returns the first page by default and reports the total page count", () => {
    const result = paginate(items, 1, 9);
    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(3);
    expect(result.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("returns the right slice for a middle page", () => {
    expect(paginate(items, 2, 9).items).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18]);
  });

  it("clamps a too-high page to the last page", () => {
    const result = paginate(items, 99, 9);
    expect(result.page).toBe(3);
    expect(result.items).toEqual([19, 20, 21, 22, 23, 24, 25]);
  });

  it("clamps zero / negative requested pages to 1", () => {
    expect(paginate(items, 0, 9).page).toBe(1);
    expect(paginate(items, -5, 9).page).toBe(1);
  });

  it("reports at least one page when there are no items", () => {
    const result = paginate([], 1, 9);
    expect(result.page).toBe(1);
    expect(result.pageCount).toBe(1);
    expect(result.items).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const original = [...items];
    paginate(items, 2, 9);
    expect(items).toEqual(original);
  });

  it("works when items fit on a single page exactly", () => {
    const result = paginate([1, 2, 3], 1, 3);
    expect(result.pageCount).toBe(1);
    expect(result.items).toEqual([1, 2, 3]);
  });
});
