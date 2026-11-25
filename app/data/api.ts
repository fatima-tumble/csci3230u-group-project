import type { Category, CategoryFilter } from "./categories";
import type { MockPlace } from "./places";

const API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY;

const CATEGORY_TO_KINDS: Record<Category, string> = {
  Food: "foods",
  Events: "theatres_and_entertainments,cultural",
  Entertainment: "amusements,theatres_and_entertainments,cinemas",
  Activities: "sport,natural,interesting_places",
};

const KIND_TO_CATEGORY: Array<[RegExp, Category]> = [
  [/foods/, "Food"],
  [/amusements|cinemas|nightclubs/, "Entertainment"],
  [/theatres_and_entertainments|cultural|museums|historic/, "Events"],
  [/sport|natural|interesting_places|other/, "Activities"],
];

function mapKindsToCategories(kinds: string): Category[] {
  const found = new Set<Category>();
  for (const [re, cat] of KIND_TO_CATEGORY) {
    if (re.test(kinds)) found.add(cat);
  }
  if (found.size === 0) found.add("Activities");
  return Array.from(found);
}

// in-memory caches for the session. nominatim and opentripmap both rate-limit
// their free tiers (nominatim is ~1 req/sec), so a repeat click on the same
// location/category shouldn't re-hit the network.
const geocodeCache = new Map<string, GeocodeResult | null>();
const nearbyCache = new Map<string, MockPlace[]>();
const placeDetailsCache = new Map<string, unknown>();

// one retry after a short delay on transient failures. aborts bail out
// immediately so we don't waste time on a request the caller already cancelled.
async function fetchWithRetry(input: string, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, init);
    if (res.ok) return res;
    if (res.status < 500 && res.status !== 429) return res;
    throw new Error(`transient ${res.status}`);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    await new Promise((r) => setTimeout(r, 600));
    return fetch(input, init);
  }
}

export type GeocodeResult = { lat: number; lon: number; label: string };

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult | null> {
  const key = query.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1`;
  const res = await fetchWithRetry(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    geocodeCache.set(key, null);
    return null;
  }
  const result: GeocodeResult = {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    label: data[0].display_name,
  };
  geocodeCache.set(key, result);
  return result;
}

type OtmRadiusItem = {
  xid: string;
  name: string;
  dist: number;
  kinds: string;
  preview?: { source: string };
};

export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  category: CategoryFilter,
  signal?: AbortSignal,
): Promise<MockPlace[]> {
  const cacheKey = `${lat.toFixed(4)}|${lon.toFixed(4)}|${category}`;
  const cached = nearbyCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    apikey: API_KEY,
    lat: String(lat),
    lon: String(lon),
    radius: "5000",
    limit: "40",
    format: "json",
    rate: "2",
  });
  if (category !== "All") params.set("kinds", CATEGORY_TO_KINDS[category]);

  const res = await fetchWithRetry(`https://api.opentripmap.com/0.1/en/places/radius?${params}`, { signal });
  if (!res.ok) throw new Error(`OpenTripMap error: ${res.status}`);
  const data: OtmRadiusItem[] = await res.json();

  const mapped = data
    .filter((p) => p.name && p.xid)
    .map((p) => ({
      xid: p.xid,
      name: p.name,
      description: "",
      distanceKm: Math.round(p.dist / 100) / 10,
      categories: mapKindsToCategories(p.kinds),
      image: normalizeThumb(p.preview?.source),
    }));
  nearbyCache.set(cacheKey, mapped);
  return mapped;
}

// opentripmap returns wikimedia thumbs at 400px, which wikimedia no longer
// serves for arbitrary sizes. rewrite to a size that's actually cached.
function normalizeThumb(src?: string): string | undefined {
  if (!src) return undefined;
  return src.replace(/\/\d+px-/, "/960px-");
}

type NominatimItem = {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
};

export async function searchPlacesByName(name: string, signal?: AbortSignal): Promise<MockPlace[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=jsonv2&limit=30&addressdetails=0`;
  const res = await fetchWithRetry(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data: NominatimItem[] = await res.json();

  return data.map((item) => {
    const kinds = [item.class, item.type].filter(Boolean).join(",");
    return {
      xid: `osm-${item.osm_type}-${item.osm_id}`,
      name: item.name || item.display_name.split(",")[0],
      description: item.display_name,
      distanceKm: 0,
      categories: mapKindsToCategories(kinds),
    };
  });
}

export async function fetchPlaceDetails(xid: string, signal?: AbortSignal): Promise<any | null> {
  if (xid.startsWith("osm-")) return null;
  if (placeDetailsCache.has(xid)) return placeDetailsCache.get(xid);
  const res = await fetchWithRetry(`https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${API_KEY}`, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  placeDetailsCache.set(xid, data);
  return data;
}

export async function fetchPlaceImage(xid: string, signal?: AbortSignal): Promise<string | null> {
  const data = await fetchPlaceDetails(xid, signal);
  return normalizeThumb(data?.preview?.source) ?? null;
}
