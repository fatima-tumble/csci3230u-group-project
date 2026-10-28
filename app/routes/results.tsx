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

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Results" },
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
    <main className="flex flex-col gap-4 m-4 w-[95%] mx-auto">
      <h1 className="text-2xl font-bold mt-4">Places near you</h1>
      <SearchBar value={query} onChange={setQuery} />
      <FilterBar selected={selectedCategory} onSelect={setSelectedCategory} />
      {visiblePlaces.length === 0 ? (
        <NoPlacesFound
          category={selectedCategory}
          onShowAll={() => {
            setSelectedCategory("All");
            setQuery("");
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
