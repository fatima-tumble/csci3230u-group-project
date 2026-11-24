import { useEffect, useState } from "react";
import { createSearchParams, useNavigate } from "react-router";
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import Header  from "../components/header";
import Tag from "../components/tags";
import PlaceCard from "../components/placeCard";
import RecentlyViewed from "../components/recentlyViewed";
import SuggestedCategories from "../components/suggestedCategories";
import { categories, type Category } from "../data/categories";
import { suggestCategories } from "../data/recentlyViewed";
import { useRecentlyViewed } from "../hooks/useRecentlyViewed";
import { fetchNearbyPlaces, geocode } from "../data/api";
import type { MockPlace } from "../data/places";

const SUGGESTION_SEED_LOCATION = "Toronto";
const SUGGESTION_COUNT = 3;

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Wander" },
    { name: "description", content: "Discover places near you." },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const { places: recentPlaces, clear: clearRecent } = useRecentlyViewed();
  const suggested = suggestCategories(recentPlaces);
  const [suggestions, setSuggestions] = useState<MockPlace[]>([]);

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
    const search = createSearchParams();
    if (query.trim()) search.set("q", query.trim());
    if (selectedCategory) search.set("category", selectedCategory);
    navigate({ pathname: "/results", search: search.toString() });
  }

  return <div className="flex flex-col min-h-screen">
    <Header />
    <div className="flex items-center justify-between flex-col my-4 px-6 w-full max-w-6xl mx-auto">
        <h1 className="mt-24 px-4 text-center text-4xl sm:text-5xl font-bold">What do you want to see?</h1>
        <form onSubmit={handleSearch} role="search" aria-label="Location search" className="flex items-center gap-2 w-full max-w-2xl mt-10 mb-8 p-2 pl-6 bg-white border-2 border-stone-300 rounded-full focus-within:border-brand">
          <label htmlFor="home-search-input" className="sr-only">City or postal code</label>
          <input
            id="home-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 min-w-0 text-sm sm:text-base font-bold bg-transparent outline-none"
            placeholder="Enter a city or postal code"
          />
          <button type="submit" className="text-sm font-bold bg-brand text-white hover:bg-brand/90 py-3 px-5 rounded-full">Search</button>
          <button type="button" aria-label="Use my location" className="whitespace-nowrap text-sm font-bold bg-accent text-stone-900 hover:bg-accent/90 py-3 px-5 rounded-full">
            <span aria-hidden="true" className="sm:hidden">📍</span>
            <span aria-hidden="true" className="hidden sm:inline">Use my location</span>
          </button>
        </form>
    </div>
    <div className="flex flex-1 flex-col mt-16 mb-6 px-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-1 flex-col rounded-2xl bg-accent p-6 sm:p-8">
        <h1 className="text-2xl font-bold">Explore by category</h1>
        <div className="mt-4">
          <SuggestedCategories categories={suggested} />
          {suggested.length > 0 && <h2 className="text-lg font-bold mb-3">All categories</h2>}
        </div>
        <div className="flex flex-row flex-wrap rounded-[10px] gap-3">
            {categories.map((category) => (
              <Tag
                key={category}
                selected={selectedCategory === category}
                onClick={() => setSelectedCategory((prev) => (prev === category ? null : category))}
              >
                {category}
              </Tag>
            ))}
        </div>
      </div>
    </div>
    <RecentlyViewed places={recentPlaces} onClear={clearRecent} />
    {suggestions.length > 0 && (
      <section aria-labelledby="suggested-heading" className="mb-12 px-6 w-full max-w-6xl mx-auto">
        <h2 id="suggested-heading" className="text-2xl font-bold">Suggested for you</h2>
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
