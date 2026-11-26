import { describe, it, expect, vi, afterEach } from "vitest";
import { pickRandom } from "./random";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pickRandom", () => {
  it("returns n items", () => {
    const out = pickRandom([1, 2, 3, 4, 5], 3);
    expect(out).toHaveLength(3);
  });

  it("returns items from the source array", () => {
    const source = ["a", "b", "c", "d"];
    for (const v of pickRandom(source, 2)) {
      expect(source).toContain(v);
    }
  });

  it("does not mutate the input", () => {
    const source = [1, 2, 3, 4];
    const snapshot = [...source];
    pickRandom(source, 2);
    expect(source).toEqual(snapshot);
  });

  it("returns the whole array if n >= length", () => {
    expect(pickRandom([1, 2], 5).sort()).toEqual([1, 2]);
  });

  it("returns nothing when n is 0", () => {
    expect(pickRandom([1, 2, 3], 0)).toEqual([]);
  });

  it("is deterministic when Math.random is stubbed", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const first = pickRandom([1, 2, 3, 4, 5], 3);
    vi.spyOn(Math, "random").mockReturnValue(0);
    const second = pickRandom([1, 2, 3, 4, 5], 3);
    expect(first).toEqual(second);
  });
});
