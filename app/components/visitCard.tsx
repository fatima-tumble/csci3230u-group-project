import { useState } from "react";
import { Link } from "react-router";
import Avatar from "./avatar";
import { profileName } from "../data/profile";
import { formatVisitDate, timeAgo, type Visit } from "../data/social";

type visitCardProps = {
  visit: Visit
  // Hide the author line on someone's own profile page, where it's obvious
  showAuthor?: boolean
  currentUsername?: string | null
  onDelete?: (visit: Visit) => Promise<void>
  onRemoveTag?: (visit: Visit) => Promise<void>
}

export default function VisitCard({ visit, showAuthor = true, currentUsername, onDelete, onRemoveTag }: visitCardProps) {
  const [busy, setBusy] = useState(false);
  const author = visit.author;
  const authorName = author ? profileName(author) : "Someone";
  const isMine = !!currentUsername && author?.username === currentUsername;
  const companions = visit.companions.map((c) => c.profile).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const taggedMe = !!currentUsername && companions.some((c) => c.username === currentUsername);

  async function run(action?: (visit: Visit) => Promise<void>, confirmText?: string) {
    if (!action || (confirmText && !window.confirm(confirmText))) return;
    setBusy(true);
    try {
      await action(visit);
    } finally {
      setBusy(false);
    }
  }

  const placeLink = (
    <Link to={`/places/${visit.xid}`} className="font-bold text-stone-900 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand">
      {visit.place_name}
    </Link>
  );

  return (
    <li>
      <article className="rounded-2xl border border-stone-300 bg-white p-5">
        <header className="flex items-start gap-3">
          {showAuthor && author && (
            <Link to={`/u/${author.username}`} className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              <Avatar name={authorName} url={author.avatar_url} />
              <span className="sr-only">{authorName}'s profile</span>
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-stone-800">
              {showAuthor && author && (
                <><Link to={`/u/${author.username}`} className="font-bold hover:underline">{authorName}</Link>{" visited "}</>
              )}
              {!showAuthor && "Visited "}
              {placeLink}
            </p>
            <p className="mt-0.5 text-xs text-stone-600">
              <time dateTime={visit.visited_on}>{formatVisitDate(visit.visited_on)}</time>
              <span aria-hidden="true"> · </span>
              posted <time dateTime={visit.created_at}>{timeAgo(visit.created_at)}</time>
              {visit.visibility === "public" ? <span> · Public</span> : <span> · Followers</span>}
            </p>
          </div>
          <p className="shrink-0 rounded-full bg-accent px-3 py-1 text-sm font-bold text-stone-900">
            {visit.rating}<span className="font-normal">/10</span>
            <span className="sr-only"> rating</span>
          </p>
        </header>

        {visit.blurb && <p className="mt-3 whitespace-pre-line text-stone-900">{visit.blurb}</p>}

        {visit.photos.length > 0 && (
          <ul className={`mt-3 grid gap-2 ${visit.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {visit.photos.map((src, i) => (
              <li key={src}>
                <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-brand">
                  <img src={src} alt={`Photo ${i + 1} from ${authorName}'s visit to ${visit.place_name}`} loading="lazy" className="aspect-4/3 w-full object-cover" />
                </a>
              </li>
            ))}
          </ul>
        )}

        {companions.length > 0 && (
          <p className="mt-3 text-sm text-stone-700">
            With{" "}
            {companions.map((c, i) => (
              <span key={c.username}>
                {i > 0 && (i === companions.length - 1 ? " and " : ", ")}
                <Link to={`/u/${c.username}`} className="font-semibold hover:underline">@{c.username}</Link>
              </span>
            ))}
          </p>
        )}

        {(isMine && onDelete) || (taggedMe && onRemoveTag) ? (
          <footer className="mt-3 flex justify-end gap-3 border-t border-stone-200 pt-3">
            {taggedMe && onRemoveTag && (
              <button type="button" disabled={busy} onClick={() => run(onRemoveTag)} className="text-sm font-semibold text-stone-700 underline underline-offset-2 hover:text-stone-950 disabled:opacity-60">
                Remove my tag
              </button>
            )}
            {isMine && onDelete && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(onDelete, `Delete your visit to ${visit.place_name}? This can't be undone.`)}
                className="text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 disabled:opacity-60"
              >
                Delete
              </button>
            )}
          </footer>
        ) : null}
      </article>
    </li>
  );
}
