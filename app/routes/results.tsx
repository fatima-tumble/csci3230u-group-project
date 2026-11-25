import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/results";
import Header from "../components/header";
import FilterBar from "../components/filterBar";
import NoPlacesFound from "../components/noPlacesFound";
import PlaceCard from "../components/placeCard";
import SearchBar from "../components/searchBar";
import ComparePanel from "../components/comparePanel";
import usePlaceComparison from "~/hooks/usePlaceComparison";
import { filterPlacesByQuery, type MockPlace } from "../data/places";
import { categories, type CategoryFilter } from "../data/categories";
import { fetchNearbyPlaces, geocode } from "../data/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Results · Wander" },
    { name: "description", content: "Browse places near you." },
  ];
}

const DEFAULT_LOCATION = "Toronto";
const PAGE_SIZE = 9;

function readCategoryParam(raw: string | null): CategoryFilter {
  if (!raw) return "All";
  const match = (categories as readonly string[]).find((c) => c.toLowerCase() === raw.toLowerCase());
  return (match as CategoryFilter) ?? "All";
}

function readPageParam(raw: string | null): number {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryLocation = (searchParams.get("q") ?? "").trim();
  const isDefault = queryLocation.length === 0;
  const location = isDefault ? DEFAULT_LOCATION : queryLocation;

  const [nameFilter, setNameFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(
    readCategoryParam(searchParams.get("category")),
  );

  const [places, setPlaces] = useState<MockPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  const { selectedIds, selectedPlaces, isPanelOpen, setIsPanelOpen, toggleComparePlace, removeComparePlace, } = usePlaceComparison(places);
  const requestedPage = readPageParam(searchParams.get("page"));

  useEffect(() => {
    setSearchParams(
      (prev) => {
        if (selectedCategory !== "All") prev.set("category", selectedCategory);
        else prev.delete("category");
        prev.delete("page");
        return prev;
      },
      { replace: true },
    );
  }, [selectedCategory]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        prev.delete("page");
        return prev;
      },
      { replace: true },
    );
  }, [nameFilter]);

  function goToPage(next: number) {
    setSearchParams(
      (prev) => {
        if (next <= 1) prev.delete("page");
        else prev.set("page", String(next));
        return prev;
      },
      { replace: false },
    );
  }

  useEffect(() => {
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
  const pageCount = Math.max(1, Math.ceil(visiblePlaces.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const pagedPlaces = visiblePlaces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const shortLabel = locationLabel?.split(",")[0] ?? location;
  const heading = `Places near ${shortLabel}`;

  return <>
    <Header />
    <main className="flex flex-col gap-4 my-4 px-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center mt-4 justify-between">
        <h1 className="text-2xl font-bold mt-4">{heading}</h1>
        {selectedIds.length > 0 && (
          <button type="button"
                  onClick={() => setIsPanelOpen(true)}
                  aria-expanded={isPanelOpen}
                  aria-controls="compare-panel"
                  className="rounded-md border border-brand px-4 py-2 font-semibold text-stone hover:bg-brand/15"
          >
            Compare ({selectedIds.length})
          </button>
        )}
      </div>

      {isDefault && !loading && !error && (
        <p className="text-sm text-stone-600">
          Showing a default view. Search for a city or postal code on the home page to see places near you.
        </p>
      )}
      <SearchBar value={nameFilter} onChange={setNameFilter} />
      <FilterBar selected={selectedCategory} onSelect={setSelectedCategory} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section aria-label="Search results" className="min-w-0 flex-1">
          {loading ? (
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
            <>
              <ul aria-label="Places" className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isPanelOpen ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
                {pagedPlaces.map((place) => (
                  <PlaceCard
                    key={place.xid}
                    place={place}
                    isSelected={selectedIds.includes(place.xid)}
                    placeLimit={selectedPlaces.length >= 3}
                    onToggle={toggleComparePlace}
                  />
                ))}
              </ul>
              {pageCount > 1 && (
                <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="rounded-full border-2 border-stone-300 bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:border-brand"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-stone-700" aria-live="polite">
                    Page {page} of {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= pageCount}
                    className="rounded-full border-2 border-stone-300 bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:border-brand"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
        {isPanelOpen && (
          <ComparePanel selectedPlaces={selectedPlaces} onToggle={() => setIsPanelOpen(false)} onRemove={removeComparePlace}/>
        )}
      </div>
    </main>

    {isPanelOpen && (
      <button type="button"
              aria-label="Close comparison panel"
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 z-40 lg:hidden cursor-default bg-black/30"
      />
    )}
  </>
}
