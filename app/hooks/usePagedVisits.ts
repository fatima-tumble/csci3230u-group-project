import { useCallback, useEffect, useRef, useState } from "react";
import { PAGE_SIZE, type Visit } from "../data/social";

type State = {
  visits: Visit[]
  status: "idle" | "loading" | "ready" | "error"
  error: string | null
  hasMore: boolean
  loadingMore: boolean
}

// Loads visits a page at a time ("Load more"). `key` identifies the list: when it changes
// (e.g. a different profile), the list starts over and stale responses are ignored.
export function usePagedVisits(fetchPage: ((page: number) => Promise<Visit[]>) | null, key: string) {
  const [state, setState] = useState<State>({ visits: [], status: "idle", error: null, hasMore: false, loadingMore: false });
  const pageRef = useRef(0);
  const requestId = useRef(0);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const load = useCallback(async (page: number) => {
    const fetcher = fetchRef.current;
    if (!fetcher) return;
    const id = ++requestId.current;
    setState((s) => page === 0
      ? { visits: [], status: "loading", error: null, hasMore: false, loadingMore: false }
      : { ...s, loadingMore: true });
    try {
      const rows = await fetcher(page);
      if (id !== requestId.current) return;
      pageRef.current = page;
      setState((s) => ({
        visits: page === 0 ? rows : [...s.visits, ...rows.filter((r) => !s.visits.some((v) => v.id === r.id))],
        status: "ready",
        error: null,
        hasMore: rows.length === PAGE_SIZE,
        loadingMore: false,
      }));
    } catch (err) {
      if (id !== requestId.current) return;
      setState((s) => ({ ...s, status: page === 0 ? "error" : s.status, error: (err as Error).message, loadingMore: false }));
    }
  }, []);

  useEffect(() => {
    if (fetchPage) load(0);
    else setState({ visits: [], status: "idle", error: null, hasMore: false, loadingMore: false });
    return () => { requestId.current++; };
  }, [key, fetchPage === null, load]);

  return {
    ...state,
    reload: () => load(0),
    loadMore: () => load(pageRef.current + 1),
    removeVisit: (id: string) => setState((s) => ({ ...s, visits: s.visits.filter((v) => v.id !== id) })),
  };
}
