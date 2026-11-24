import VisitCard from "./visitCard";
import Button from "./button";
import { useAuth } from "../context/auth";
import { deleteVisit, removeMyTag } from "../data/socialApi";
import type { usePagedVisits } from "../hooks/usePagedVisits";
import type { Visit } from "../data/social";

type visitListProps = {
  list: ReturnType<typeof usePagedVisits>
  label: string
  showAuthor?: boolean
  empty: React.ReactNode
}

// A feed of visit cards with loading / error / empty states and "Load more"
export default function VisitList({ list, label, showAuthor = true, empty }: visitListProps) {
  const { user, profile } = useAuth();

  async function handleDelete(visit: Visit) {
    await deleteVisit(visit);
    list.removeVisit(visit.id);
  }

  async function handleRemoveTag(visit: Visit) {
    if (!user) return;
    await removeMyTag(user.id, visit.id);
    list.reload();
  }

  if (list.status === "loading" || list.status === "idle") {
    return <p role="status" className="text-stone-700">Loading posts…</p>;
  }

  if (list.status === "error") {
    return (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p className="font-bold">Couldn't load posts.</p>
        <p className="text-sm text-stone-700">{list.error}</p>
        <Button variant="secondary" onClick={list.reload}>Try again</Button>
      </div>
    );
  }

  if (list.visits.length === 0) return <>{empty}</>;

  return (
    <div className="flex flex-col gap-4">
      <ul aria-label={label} className="flex flex-col gap-4">
        {list.visits.map((visit) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            showAuthor={showAuthor}
            currentUsername={profile?.username}
            onDelete={handleDelete}
            onRemoveTag={handleRemoveTag}
          />
        ))}
      </ul>
      {list.hasMore && (
        <Button variant="secondary" className="self-center" disabled={list.loadingMore} onClick={list.loadMore}>
          {list.loadingMore ? "Loading…" : "Load more"}
        </Button>
      )}
      {list.error && list.status === "ready" && <p role="alert" className="text-sm text-red-700">{list.error}</p>}
    </div>
  );
}
