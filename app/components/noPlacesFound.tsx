import type { CategoryFilter } from "../data/categories";

type noPlacesFoundProps = {
    category: CategoryFilter
    onShowAll?: () => void
}

export default function NoPlacesFound({ category, onShowAll }: noPlacesFoundProps) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 rounded-[10px] border-2 border-[#494949] p-4">
      <p className="font-bold">
        {category === "All" ? "No places found." : `No places found in ${category}.`}
      </p>
      {onShowAll && category !== "All" && (
        <button type="button" onClick={onShowAll} className="text-sm font-bold bg-[#474747] p-2 rounded-[10px]">
          Show all places
        </button>
      )}
    </div>
  );
}
