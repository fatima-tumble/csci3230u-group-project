import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/results";
import Header from "../components/header";
import FilterBar from "../components/filterBar";
import NoPlacesFound from "../components/noPlacesFound";
import PlaceCard from "../components/placeCard";
import SearchBar from "../components/searchBar";
import { filterPlacesByQuery, type MockPlace } from "../data/places";
import { categories, type CategoryFilter } from "../data/categories";
import { fetchNearbyPlaces, geocode } from "../data/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Results · Wander" },
    { name: "description", content: "Browse places near you." },
  ];
}

function readCategoryParam(raw: string | null): CategoryFilter {
  if (!raw) return "All";
  const match = (categories as readonly string[]).find((c) => c.toLowerCase() === raw.toLowerCase());
  return (match as CategoryFilter) ?? "All";
}

export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = searchParams.get("q") ?? "";
  const [nameFilter, setNameFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(
    readCategoryParam(searchParams.get("category")),
  );

  const [places, setPlaces] = useState<MockPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        if (selectedCategory !== "All") prev.set("category", selectedCategory);
        else prev.delete("category");
        return prev;
      },
      { replace: true },
    );
  }, [selectedCategory]);

  useEffect(() => {
    if (!location.trim()) {
      setPlaces([]);
      setLocationLabel(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const geo = await geocode(location, controller.signal);
        if (!geo) {
          setPlaces([]);
          setLocationLabel(null);
          setError(`Couldn't find "${location}". Try a different city or postal code.`);
          setLoading(false);
          return;
        }
        setLocationLabel(geo.label);
        const results = await fetchNearbyPlaces(geo.lat, geo.lon, selectedCategory, controller.signal);
        setPlaces(results);
        setLoading(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Something went wrong loading places. Try again.");
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [location, selectedCategory]);

  const visiblePlaces = filterPlacesByQuery(places, nameFilter);
  const heading = locationLabel ? `Places near ${locationLabel.split(",")[0]}` : "Places near you";

  return <>
    <Header />
    <main className="flex flex-col gap-4 my-4 px-6 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mt-4">{heading}</h1>
      <SearchBar value={nameFilter} onChange={setNameFilter} />
      <FilterBar selected={selectedCategory} onSelect={setSelectedCategory} />
      {!location.trim() ? (
        <p className="text-stone-600">Enter a city or postal code on the home page to see places.</p>
      ) : loading ? (
        <p role="status" className="text-stone-600">Loading places…</p>
      ) : error ? (
        <p role="alert" className="text-stone-700">{error}</p>
      ) : visiblePlaces.length === 0 ? (
        <NoPlacesFound
          category={selectedCategory}
          onShowAll={() => {
            setSelectedCategory("All");
            setNameFilter("");
          }}
        />
      ) : (
        <ul aria-label="Places" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePlaces.map((place) => (
            <PlaceCard key={place.xid} place={place} />
          ))}
        </ul>
      )}
    </main>
  </>
}
