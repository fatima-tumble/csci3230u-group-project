import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/results";
import Header from "../components/header";
import FilterBar from "../components/filterBar";
import NoPlacesFound from "../components/noPlacesFound";
import PlaceCard from "../components/placeCard";
import SearchBar from "../components/searchBar";
import { mockPlaces, filterPlacesByCategory, filterPlacesByQuery } from "../data/places";
import { categories, type CategoryFilter } from "../data/categories";
import ComparePanel from "../components/comparePanel";

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
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(
    readCategoryParam(searchParams.get("category")),
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  function togglePlace(placeId:string) {
    setSelectedIds((currentIds) => {
      // If a place is already selected, removes it.
      if (currentIds.includes(placeId)) {
          return currentIds.filter((id) => id !== placeId);
      }
      // If three places are already selected, keep currentIds unchanged.
      if (currentIds.length >= 3) {
          return currentIds;
      }
      // Otherwise, return a new array with the added selected place ID.
      return [...currentIds, placeId];
    });
  }

  const selectedPlaces = mockPlaces.filter((place) => selectedIds.includes(place.xid));

  useEffect(() => {
    setSearchParams(
      (prev) => {
        if (query.trim()) prev.set("q", query.trim());
        else prev.delete("q");
        if (selectedCategory !== "All") prev.set("category", selectedCategory);
        else prev.delete("category");
        return prev;
      },
      { replace: true },
    );
  }, [query, selectedCategory]);

  const byCategory = filterPlacesByCategory(mockPlaces, selectedCategory);
  const visiblePlaces = filterPlacesByQuery(byCategory, query);

  return <>
    <Header />
    <main className="flex flex-col gap-4 my-4 px-6 w-full max-w-6xl mx-auto">
      <div className="mt-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold mt-4">Places near you</h1>

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
      <SearchBar value={query} onChange={setQuery} />
      <FilterBar selected={selectedCategory} onSelect={setSelectedCategory} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <section aria-label="Search results" className="min-w-0 flex-1">
          {visiblePlaces.length === 0 ? (
            <NoPlacesFound
              category={selectedCategory}
              onShowAll={() => {
                setSelectedCategory("All");
                setQuery("");
              }}
            />
          ) : (
            <ul aria-label="Places" className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${ isPanelOpen ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
              {visiblePlaces.map((place) => (
                <PlaceCard key={place.xid}
                           place={place}
                           isSelected={selectedIds.includes(place.xid)}
                           placeLimit={selectedIds.length >= 3}
                           onToggle={togglePlace}
                />
              ))}
            </ul>
          )}
        </section>

      {isPanelOpen && (
        <>
          <ComparePanel selectedPlaces={selectedPlaces}
                        onRemove={togglePlace}
                        onToggle={() => setIsPanelOpen(false)}/>
        </>
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
