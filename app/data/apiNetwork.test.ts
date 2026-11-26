import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  geocode,
  fetchNearbyPlaces,
  fetchPlaceDetails,
  fetchPlaceImage,
  searchPlacesByName,
} from "./api";

// Helper for building a Response-like object returned from a stubbed fetch.
function jsonOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function errorRes(status: number): Response {
  return new Response("", { status });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("geocode", () => {
  it("returns lat/lon/label from the first nominatim hit", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([
      { lat: "43.65", lon: "-79.38", display_name: "Toronto, Ontario, Canada" },
    ]));
    const result = await geocode("toronto-unique-1");
    expect(result).toEqual({ lat: 43.65, lon: -79.38, label: "Toronto, Ontario, Canada" });
  });

  it("returns null when nominatim finds nothing", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([]));
    const result = await geocode("asdfghjkl-nothing-here");
    expect(result).toBeNull();
  });

  it("caches a successful lookup so repeat calls don't hit the network", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([
      { lat: "1", lon: "2", display_name: "Cachetown" },
    ]));
    await geocode("cachetown-unique");
    await geocode("cachetown-unique");
    await geocode("CACHETOWN-UNIQUE"); // case-insensitive cache key
    expect((fetch as any).mock.calls.length).toBe(1);
  });
});

describe("fetchNearbyPlaces", () => {
  it("maps the opentripmap radius response into MockPlace shape", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([
      { xid: "x1", name: "Place A", dist: 1234, kinds: "foods", preview: { source: "https://wiki/400px-a.jpg" } },
      { xid: "x2", name: "Place B", dist: 50,   kinds: "sport" },
      { xid: "x3", name: "",        dist: 10,   kinds: "foods" }, // dropped: no name
    ]));
    const places = await fetchNearbyPlaces(49.01, -123.02, "All");
    expect(places).toHaveLength(2);
    expect(places[0]).toMatchObject({
      xid: "x1",
      name: "Place A",
      distanceKm: 1.2,
      categories: ["Food"],
    });
    expect(places[0].image).toContain("/960px-"); // normalizeThumb ran
    expect(places[1]).toMatchObject({ xid: "x2", distanceKm: 0.1, categories: ["Activities"] });
  });

  it("passes the mapped kinds param when a specific category is selected", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([]));
    await fetchNearbyPlaces(49.011, -123.021, "Food");
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).toContain("kinds=foods");
  });

  it("omits the kinds param when category is 'All'", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([]));
    await fetchNearbyPlaces(49.012, -123.022, "All");
    const url = (fetch as any).mock.calls[0][0] as string;
    expect(url).not.toContain("kinds=");
  });

  it("caches by rounded lat/lon + category", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([]));
    await fetchNearbyPlaces(49.013, -123.023, "Food");
    await fetchNearbyPlaces(49.013, -123.023, "Food");
    expect((fetch as any).mock.calls.length).toBe(1);
  });
});

describe("fetchPlaceDetails", () => {
  it("short-circuits for OSM-style xids without a network call", async () => {
    const result = await fetchPlaceDetails("osm-way-123456");
    expect(result).toBeNull();
    expect((fetch as any).mock.calls.length).toBe(0);
  });

  it("returns the body of the opentripmap details response", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk({ xid: "N1-unique", name: "Spot" }));
    const result = await fetchPlaceDetails("N1-unique");
    expect(result).toMatchObject({ xid: "N1-unique", name: "Spot" });
  });

  it("returns null on a hard 404 without retrying", async () => {
    (fetch as any).mockResolvedValueOnce(errorRes(404));
    const result = await fetchPlaceDetails("missing-xid-unique");
    expect(result).toBeNull();
    expect((fetch as any).mock.calls.length).toBe(1);
  });
});

describe("fetchPlaceImage", () => {
  it("returns a normalized wikimedia thumbnail from the details endpoint", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk({
      preview: { source: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/X.jpg/400px-X.jpg" },
    }));
    const url = await fetchPlaceImage("img-xid-unique");
    expect(url).toContain("/960px-");
  });

  it("returns null when the place has no preview", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk({ name: "Spot" }));
    expect(await fetchPlaceImage("no-preview-xid-unique")).toBeNull();
  });

  it("returns null for OSM xids without hitting the network", async () => {
    expect(await fetchPlaceImage("osm-node-9999")).toBeNull();
    expect((fetch as any).mock.calls.length).toBe(0);
  });
});

describe("searchPlacesByName", () => {
  it("prefixes OSM xids so they can be distinguished from opentripmap ones", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([
      { place_id: 1, osm_type: "node", osm_id: 10, lat: "0", lon: "0", display_name: "Thing, Place", name: "Thing", class: "amenity", type: "restaurant" },
    ]));
    const results = await searchPlacesByName("thing-unique");
    expect(results[0].xid).toBe("osm-node-10");
  });

  it("falls back to the first part of display_name when no name is given", async () => {
    (fetch as any).mockResolvedValueOnce(jsonOk([
      { place_id: 2, osm_type: "way", osm_id: 20, lat: "0", lon: "0", display_name: "Fallback Name, City" },
    ]));
    const results = await searchPlacesByName("fallback-unique");
    expect(results[0].name).toBe("Fallback Name");
  });
});

describe("fetchWithRetry (via geocode)", () => {
  it("retries on 429 then succeeds", async () => {
    (fetch as any)
      .mockResolvedValueOnce(errorRes(429))
      .mockResolvedValueOnce(jsonOk([{ lat: "1", lon: "2", display_name: "Retried" }]));
    const promise = geocode("retry-city-unique");
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result?.label).toBe("Retried");
    expect((fetch as any).mock.calls.length).toBe(2);
  });

  it("retries on 5xx then succeeds", async () => {
    (fetch as any)
      .mockResolvedValueOnce(errorRes(503))
      .mockResolvedValueOnce(jsonOk([{ lat: "3", lon: "4", display_name: "Retried-5xx" }]));
    const promise = geocode("retry-5xx-unique");
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result?.label).toBe("Retried-5xx");
    expect((fetch as any).mock.calls.length).toBe(2);
  });

  it("stops retrying on 4xx (not 429)", async () => {
    (fetch as any).mockResolvedValueOnce(errorRes(400));
    await expect(geocode("bad-request-unique")).rejects.toThrow();
    expect((fetch as any).mock.calls.length).toBe(1);
  });

  it("gives up after enough failures", async () => {
    (fetch as any).mockResolvedValue(errorRes(500));
    const promise = geocode("always-fails-unique").catch((e) => e);
    await vi.runAllTimersAsync();
    await promise;
    expect((fetch as any).mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
