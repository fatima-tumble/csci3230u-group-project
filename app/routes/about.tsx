import type { Route } from "./+types/about";
import Header from "../components/header";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About · Wander" },
    { name: "description", content: "About Wander and the team." },
  ];
}

const team = [
  { name: "Fatima Nawaz", role: "Project Lead", slice: "layout, responsive shell, repo and board upkeep" },
  { name: "Vincent Wong", role: "UI Developer", slice: "search and interactions, overall polish" },
  { name: "Julian Cruzet", role: "Discovery Developer", slice: "categories, tags, browsing history" },
  { name: "Brian Chan", role: "Content Developer", slice: "detail page, distance and hours, directions" },
  { name: "Matthew Wong", role: "Integration Developer", slice: "OpenTripMap wiring, map components, secondary API" },
];

export default function About() {
  return <>
    <Header />
    <main className="flex flex-col gap-12 py-12 px-6 w-full max-w-4xl mx-auto">
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold">About Wander</h1>
        <p className="mt-4 leading-relaxed text-stone-700">
          Wander helps you discover places near a city or postal code: food spots, events,
          entertainment, and things to do. Search for a location, browse by category, and open a place
          to see details and a map.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">The team</h2>
        <p className="mt-2 text-stone-600">Team Wander, CSCI 3230U group project.</p>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {team.map((m) => (
            <li key={m.name} className="rounded-[10px] border border-stone-300 bg-white p-5">
              <p className="font-semibold">{m.name}</p>
              <p className="mt-1 text-sm font-medium text-brand">{m.role}</p>
              <p className="mt-2 text-sm text-stone-600">{m.slice}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Data sources</h2>
        <ul className="mt-4 flex flex-col gap-2 text-stone-700">
          <li>
            Places from{" "}
            <a href="https://opentripmap.io/product" target="_blank" rel="noreferrer" className="underline hover:text-brand">
              OpenTripMap
            </a>
          </li>
          <li>
            Geocoding from{" "}
            <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noreferrer" className="underline hover:text-brand">
              Nominatim (OpenStreetMap)
            </a>
          </li>
          <li>
            Place descriptions from{" "}
            <a href="https://www.wikipedia.org/" target="_blank" rel="noreferrer" className="underline hover:text-brand">
              Wikipedia
            </a>
          </li>
        </ul>
      </section>
    </main>
  </>
}
