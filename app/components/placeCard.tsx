import { Link } from "react-router";
import CategoryTags from "./categoryTags";
import type { MockPlace } from "../data/places";

type placeCardProps = {
    place: MockPlace
}

function PlaceImage({ place }: placeCardProps) {
  if (place.image) {
    return (
      <img
        src={place.image}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
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
    <div
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center bg-[#1E1D1D] text-2xl font-semibold text-gray-500"
    >
      {initials}
    </div>
  );
}

export default function PlaceCard({ place }: placeCardProps) {
  const primaryCategory = place.categories[0];
  return (
    <li>
      <article className="group relative h-full flex flex-col overflow-hidden rounded-[10px] border border-[#494949] bg-[#141414] transition-colors hover:border-[#6b6b6b] hover:bg-[#191919]">
        <div className="aspect-[16/10] w-full overflow-hidden bg-[#1E1D1D]">
          <PlaceImage place={place} />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="text-lg font-semibold leading-tight">
            <Link
              to={`/places/${place.xid}`}
              className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {place.name}
            </Link>
          </h3>
          <p className="text-xs text-gray-400">
            {primaryCategory}
            <span aria-hidden="true" className="mx-1.5">·</span>
            {place.distanceKm} km away
          </p>
          <p className="flex-1 text-sm leading-relaxed text-gray-300 line-clamp-3">{place.description}</p>
          <CategoryTags categories={place.categories} />
        </div>
      </article>
    </li>
  );
}
