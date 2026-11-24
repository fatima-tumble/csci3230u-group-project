import { useState } from "react";
import { Link } from "react-router";
import type { RecentlyViewedPlace } from "../data/recentlyViewed";

type recentlyViewedProps = {
  places: RecentlyViewedPlace[]
  onClear: () => void
}

// Wikimedia only serves thumbnails at certain standard widths, so OpenTripMap's sizes
// (e.g. 254px, 400px) get rejected. 330px is a standard width that suits these small cards.
function thumbnailUrl(src: string) {
  return src.replace(/\/\d+px-/, "/330px-");
}

function Thumbnail({ place }: { place: RecentlyViewedPlace }) {
  const [failed, setFailed] = useState(false);
  if (place.image && !failed) {
    return (
      <img
        src={thumbnailUrl(place.image)}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  const initials = place.name
    .split(" ")
    .filter((w) => /[a-z0-9]/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div aria-hidden="true" className="flex h-full w-full items-center justify-center bg-stone-100 text-xl font-semibold text-stone-500">
      {initials}
    </div>
  );
}

export default function RecentlyViewed({ places, onClear }: recentlyViewedProps) {
  if (places.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="mb-12 px-6 w-full max-w-6xl mx-auto">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="recently-viewed-heading" className="text-2xl font-bold">Recently viewed</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-bold text-stone-800 underline underline-offset-2 hover:text-stone-950 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Clear history
        </button>
      </div>
      <ul className="mt-4 flex gap-4 overflow-x-auto snap-x pb-3">
        {places.map((place) => (
          <li key={place.xid} className="w-40 shrink-0 snap-start">
            <Link
              to={`/places/${place.xid}`}
              className="flex h-full flex-col overflow-hidden rounded-[10px] border border-stone-300 bg-white transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <div className="aspect-4/3 w-full overflow-hidden bg-stone-100">
                <Thumbnail place={place} />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="text-sm font-semibold leading-tight line-clamp-2">{place.name}</span>
                {place.categories[0] && (
                  <span className="text-xs text-stone-600">{place.categories[0]}</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
