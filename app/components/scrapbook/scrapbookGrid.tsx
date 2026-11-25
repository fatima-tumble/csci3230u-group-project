import { Link } from "react-router";
import type { ScrapbookSummary } from "../../data/scrapbookApi";

type scrapbookGridProps = {
  scrapbooks: ScrapbookSummary[]
  showPrivacy?: boolean
  onDelete?: (book: ScrapbookSummary) => void
}

export default function ScrapbookGrid({ scrapbooks, showPrivacy = false, onDelete }: scrapbookGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {scrapbooks.map((book) => (
        <li key={book.id}>
          <article className="relative flex h-full flex-col overflow-hidden rounded-[10px] border border-stone-300 bg-white transition-colors hover:border-accent">
            <div className="aspect-10/7 w-full bg-stone-100">
              {book.thumbnail_url && <img src={book.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 items-start justify-between gap-2 p-4">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">
                  <Link to={`/scrapbooks/${book.id}`} className="before:absolute before:inset-0 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                    {book.title}
                  </Link>
                </h3>
                <p className="text-xs text-stone-600">
                  Edited {new Date(book.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  {showPrivacy && <> · {book.is_public ? "On your profile" : <><span aria-hidden="true">🔒</span> Only you</>}</>}
                </p>
              </div>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(book)}
                  aria-label={`Delete ${book.title}`}
                  className="relative z-10 rounded-full px-2 py-1 text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 focus-visible:outline-2 focus-visible:outline-brand"
                >
                  Delete
                </button>
              )}
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
