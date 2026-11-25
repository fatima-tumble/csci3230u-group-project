import { useEffect, useState } from "react";
import { Link } from "react-router";
import Header from "../components/header";
import Button from "../components/button";
import ScrapbookGrid from "../components/scrapbook/scrapbookGrid";
import { useAuth } from "../context/auth";
import { loadDraft, type ScrapbookDoc } from "../data/scrapbook";
import { deleteScrapbook, fetchScrapbooks, type ScrapbookSummary } from "../data/scrapbookApi";

export function meta() {
  return [{ title: "Scrapbooks · Wander" }, { name: "description", content: "Make scrapbook pages about places you've been." }];
}

const newLinkClasses =
  "inline-flex items-center gap-2 rounded-full border-2 border-brand-dark bg-brand-dark px-5 py-2 text-sm font-bold text-white hover:bg-brand-dark/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function Scrapbooks() {
  const { enabled, loading, user } = useAuth();
  const [books, setBooks] = useState<ScrapbookSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScrapbookDoc | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => setDraft(loadDraft()), []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchScrapbooks(user.id)
      .then((b) => { if (!cancelled) setBooks(b); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [user?.id, reload]);

  async function handleDelete(book: ScrapbookSummary) {
    if (!user || !window.confirm(`Delete “${book.title}”? This can't be undone.`)) return;
    try {
      await deleteScrapbook(user.id, book.id);
      setBooks((prev) => prev?.filter((b) => b.id !== book.id) ?? null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const hasDraft = !!draft && draft.items.length > 0;

  return <>
    <Header />
    <main className="mt-4 mb-12 flex flex-col gap-6 px-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Scrapbooks</h1>
          <p className="text-stone-700">Make a page about places you've been with stickers, notes and photos.</p>
        </div>
        <Link to="/scrapbooks/new" className={newLinkClasses}>
          <span aria-hidden="true">+</span> {hasDraft ? "Continue draft" : "New scrapbook"}
        </Link>
      </div>

      {hasDraft && (
        <p className="rounded-lg bg-white px-4 py-3 text-sm text-stone-800">
          You have an unsaved draft, <span className="font-semibold">“{draft!.title}”</span>, on this device ({draft!.items.length} items).
        </p>
      )}

      {!enabled || loading ? null : !user ? (
        <div className="rounded-2xl border border-stone-300 bg-white p-6">
          <h2 className="text-xl font-bold">Try it, no account needed</h2>
          <p className="mt-1 text-stone-700">Start a page now. When you want to save it or download it as an image, you'll be asked to create a free account.</p>
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p className="font-bold">Couldn't load your scrapbooks.</p>
          <p className="text-sm text-stone-700">{error}</p>
          <Button variant="secondary" onClick={() => { setError(null); setBooks(null); setReload((n) => n + 1); }}>Try again</Button>
        </div>
      ) : !books ? (
        <p role="status">Loading your scrapbooks…</p>
      ) : books.length === 0 ? (
        <p className="text-stone-700">You haven't saved any scrapbooks yet.</p>
      ) : (
        <section aria-labelledby="my-scrapbooks">
          <h2 id="my-scrapbooks" className="mb-3 text-xl font-bold">Your scrapbooks</h2>
          <ScrapbookGrid scrapbooks={books} showPrivacy onDelete={handleDelete} />
        </section>
      )}
    </main>
  </>;
}
