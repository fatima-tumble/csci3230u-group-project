import { useEffect, useState } from "react";
import { Link } from "react-router";
import ScrapbookGrid from "./scrapbookGrid";
import { fetchScrapbooks, type ScrapbookSummary } from "../../data/scrapbookApi";

// Scrapbooks tab on a profile: everyone sees the public ones, the owner also sees their private ones
export default function ProfileScrapbooks({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const [books, setBooks] = useState<ScrapbookSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBooks(null);
    fetchScrapbooks(userId)
      .then((b) => { if (!cancelled) setBooks(b); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div>
      {error ? (
        <p role="alert" className="text-sm text-red-700">Couldn't load scrapbooks: {error}</p>
      ) : !books ? (
        <p role="status" className="text-stone-700">Loading scrapbooks…</p>
      ) : books.length === 0 ? (
        <p className="text-stone-700">
          {isOwnProfile ? <>No scrapbooks yet. <Link to="/scrapbooks/new" className="font-semibold underline">Make one</Link>.</> : "No scrapbooks yet."}
        </p>
      ) : (
        <ScrapbookGrid scrapbooks={books} showPrivacy={isOwnProfile} />
      )}
    </div>
  );
}
