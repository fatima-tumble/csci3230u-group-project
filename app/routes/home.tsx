import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import Header  from "../components/header";
import PlaceCard from "../components/placeCard";
import RecentlyViewed from "../components/recentlyViewed";
import SuggestedCategories from "../components/suggestedCategories";
import { categories } from "../data/categories";
import { resultsSearchFor } from "../data/homeSearch";
import { suggestCategories } from "../data/recentlyViewed";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { useNearbySearch } from "../hooks/useNearbySearch";
import { fetchNearbyPlaces, geocode } from "../data/api";
import type { MockPlace } from "../data/places";
import { pickRandom } from "../data/random";

const SUGGESTION_SEED_LOCATION = "Toronto";
const SUGGESTION_COUNT = 3;

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Wander" },
    { name: "description", content: "Discover places near you." },
  ];
}

type SearchMode = "location" | "name";

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<SearchMode>("location");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const { places: recentPlaces, clear: clearRecent } = useRecentlyViewed();
  const suggested = suggestCategories(recentPlaces);
  const [suggestions, setSuggestions] = useState<MockPlace[]>([]);
  const { searchNearby, loading, geoError } = useNearbySearch();

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const geo = await geocode(SUGGESTION_SEED_LOCATION, controller.signal);
        if (!geo) return;
        const all = await fetchNearbyPlaces(geo.lat, geo.lon, "All", controller.signal);
        setSuggestions(pickRandom(all, SUGGESTION_COUNT));
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSuggestions([]);
      }
    })();
    return () => controller.abort();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ pathname: "/results", search: resultsSearchFor({ mode, name, city }) });
  }

  return <div className="flex flex-col min-h-screen">
    <Header />
    <div className="flex items-center justify-between flex-col my-4 px-6 w-full max-w-6xl mx-auto">
        <h1 className="mt-24 px-4 text-center text-4xl sm:text-5xl font-bold">What do you want to see?</h1>
        <div role="radiogroup" aria-label="Search mode" className="mt-8 flex gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={mode === "location"}
            onClick={() => setMode("location")}
            className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "location" ? "bg-brand text-white" : "bg-white text-stone-700 border-2 border-stone-300 hover:border-brand"}`}
          >
            By location
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === "name"}
            onClick={() => setMode("name")}
            className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "name" ? "bg-brand text-white" : "bg-white text-stone-700 border-2 border-stone-300 hover:border-brand"}`}
          >
            By name
          </button>
        </div>
        <form onSubmit={handleSearch} role="search" aria-label={mode === "name" ? "Name search" : "Location search"} className="flex flex-wrap items-center gap-2 w-full max-w-2xl mt-4 mb-8 p-2 pl-4 bg-white border-2 border-stone-300 rounded-full focus-within:border-brand">
          {mode === "location" ? (
            <>
              <label htmlFor="home-city-input" className="sr-only">City or town</label>
              <input
                id="home-city-input"
                type="search"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex-1 min-w-0 px-2 text-sm sm:text-base font-bold bg-transparent outline-none"
                placeholder="City or town"
              />
            </>
          ) : (
            <>
              <label htmlFor="home-name-input" className="sr-only">Place name</label>
              <input
                id="home-name-input"
                type="search"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 min-w-0 px-2 text-sm sm:text-base font-bold bg-transparent outline-none"
                placeholder="Place name (e.g. CN Tower, Pizza Pizza)"
              />
            </>
          )}
          <button type="submit" className="text-sm font-bold bg-brand text-white hover:bg-brand/90 py-3 px-5 rounded-full">Search</button>
          {mode === "location" && (
            <>
              <button
                type="button"
                aria-label="Use my location"
                onClick={() => searchNearby()}
                disabled={loading}
                className="whitespace-nowrap text-sm font-bold bg-accent text-stone-900 hover:bg-accent/90 py-3 px-5 rounded-full disabled:opacity-50"
              >
                <span aria-hidden="true" className="sm:hidden">📍</span>
                <span aria-hidden="true" className="hidden sm:inline">{loading ? "Getting location..." : "Use my location"}</span>
              </button>
              {geoError && (
                <p role="alert" className="text-sm text-red-600">{geoError}</p>
              )}
            </>
          )}
        </form>
    </div>
    <div className="mt-16 mb-6 px-6 w-full max-w-6xl mx-auto">
      <div className="rounded-2xl bg-accent p-6 sm:p-8">
        <h2 className="text-2xl font-bold">Explore by category</h2>
        <div className="mt-4">
          <SuggestedCategories categories={suggested} />
          {suggested.length > 0 && <h3 className="text-lg font-bold mb-3">All categories</h3>}
        </div>
        {/* Each tag opens Explore with that category, keeping any location typed above */}
        <ul aria-label="Categories" className="flex flex-row flex-wrap gap-3">
          {categories.map((category) => (
            <li key={category}>
              <Link
                to={{ pathname: "/results", search: resultsSearchFor({ mode, name, city, category }) }}
                className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white py-2 px-5 text-xs font-medium text-stone-800 transition-colors hover:border-stone-400 hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {category}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
    <RecentlyViewed places={recentPlaces} onClear={clearRecent} />
    {suggestions.length > 0 && (
      <section aria-labelledby="suggested-heading" className="mb-12 px-6 w-full max-w-6xl mx-auto">
        <h2 id="suggested-heading" className="text-2xl font-bold">Places to try</h2>
        <ul aria-label="Suggested places" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((place) => (
            <PlaceCard
              key={place.xid}
              place={place}
              isSelected={false}
              placeLimit={false}
              onToggle={() => {}}
            />
          ))}
        </ul>
      </section>
    )}
  </div>
}
