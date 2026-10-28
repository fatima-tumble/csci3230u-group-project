import Tag from "./tags";
import type { Category, CategoryFilter } from "../data/categories";

type categoryTagsProps = {
    categories: Category[]
    selected?: CategoryFilter
    onSelect?: (category: Category) => void
}

export default function CategoryTags({ categories, selected, onSelect }: categoryTagsProps) {
  return (
    <ul aria-label="Categories" className="flex flex-row flex-wrap gap-2">
      {categories.map((category) => (
        <li key={category}>
          <Tag selected={selected === category} onClick={onSelect ? () => onSelect(category) : undefined}>
            {category}
          </Tag>
        </li>
      ))}
    </ul>
  );
}
