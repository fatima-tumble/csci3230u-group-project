import { useState } from "react";
import type { Route } from "./+types/results";
import Header from "../components/header";
import FilterBar from "../components/filterBar";
import NoPlacesFound from "../components/noPlacesFound";
import PlaceCard from "../components/placeCard";
import { mockPlaces, filterPlacesByCategory } from "../data/places";
import type { CategoryFilter } from "../data/categories";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Results" },
    { name: "description", content: "Browse places near you." },
  ];
}

export default function Results() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const visiblePlaces = filterPlacesByCategory(mockPlaces, selectedCategory);

  return <>
    <Header />
    <main className="flex flex-col gap-4 m-4 w-[95%] mx-auto">
      <h1 className="text-2xl font-bold mt-4">Places near you</h1>
      <FilterBar selected={selectedCategory} onSelect={setSelectedCategory} />
      {visiblePlaces.length === 0 ? (
        <NoPlacesFound category={selectedCategory} onShowAll={() => setSelectedCategory("All")} />
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
