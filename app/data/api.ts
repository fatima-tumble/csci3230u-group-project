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

export type GeocodeResult = { lat: number; lon: number; label: string };

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=1`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    label: data[0].display_name,
  };
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

  const res = await fetch(`https://api.opentripmap.com/0.1/en/places/radius?${params}`, { signal });
  if (!res.ok) throw new Error(`OpenTripMap error: ${res.status}`);
  const data: OtmRadiusItem[] = await res.json();

  return data
    .filter((p) => p.name && p.xid)
    .map((p) => ({
      xid: p.xid,
      name: p.name,
      description: "",
      distanceKm: Math.round(p.dist / 100) / 10,
      categories: mapKindsToCategories(p.kinds),
      image: normalizeThumb(p.preview?.source),
    }));
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
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
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

export async function fetchPlaceImage(xid: string, signal?: AbortSignal): Promise<string | null> {
  if (xid.startsWith("osm-")) return null;
  const res = await fetch(`https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${API_KEY}`, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  return normalizeThumb(data?.preview?.source) ?? null;
}
