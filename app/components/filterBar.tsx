import Tag from "./tags";
import { categories, type CategoryFilter } from "../data/categories";

type filterBarProps = {
    selected: CategoryFilter
    onSelect: (category: CategoryFilter) => void
}

const filterOptions: CategoryFilter[] = ["All", ...categories];

export default function FilterBar({ selected, onSelect }: filterBarProps) {
  return (
    <div role="group" aria-label="Filter by category" className="flex flex-row flex-wrap gap-3">
      {filterOptions.map((category) => (
        <Tag key={category} selected={selected === category} onClick={() => onSelect(category)}>
          {category}
        </Tag>
      ))}
    </div>
  );
}
