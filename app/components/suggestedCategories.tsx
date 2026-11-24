import { Link } from "react-router";
import type { Category } from "../data/categories";

type suggestedCategoriesProps = {
  categories: Category[]
}

// Category shortcuts based on browsing history. Each one goes straight to the results page.
export default function SuggestedCategories({ categories }: suggestedCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold">Suggested for you</h2>
      <p className="text-sm text-stone-800">Based on places you've viewed</p>
      <ul className="mt-3 flex flex-row flex-wrap gap-3">
        {categories.map((category) => (
          <li key={category}>
            <Link
              to={`/results?category=${encodeURIComponent(category)}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-brand bg-white py-2 px-5 text-xs font-bold text-stone-900 transition-colors hover:bg-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span aria-hidden="true" className="text-brand">★</span>
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
