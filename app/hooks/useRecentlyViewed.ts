import { useSyncExternalStore } from "react";
import {
  RECENTLY_VIEWED_KEY,
  addRecentlyViewed,
  parseRecentlyViewed,
  type RecentlyViewedPlace,
} from "../data/recentlyViewed";

// localStorage is the source of truth. useSyncExternalStore keeps every component that uses
// this hook in sync, including other tabs (via the "storage" event) and the server render
// (where there is no localStorage, so the list is empty).

const CHANGE_EVENT = "wander:recently-viewed-change";
const EMPTY: RecentlyViewedPlace[] = [];

let cachedRaw: string | null = null;
let cachedList: RecentlyViewedPlace[] = EMPTY;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(RECENTLY_VIEWED_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): RecentlyViewedPlace[] {
  const raw = readRaw();
  // Only re-parse when the stored string changes, so React gets a stable array between renders.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = parseRecentlyViewed(raw);
  }
  return cachedList;
}

function getServerSnapshot(): RecentlyViewedPlace[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === RECENTLY_VIEWED_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(list: RecentlyViewedPlace[]) {
  try {
    if (list.length === 0) window.localStorage.removeItem(RECENTLY_VIEWED_KEY);
    else window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
  } catch {
    // Storage can be full or blocked (e.g. some private modes). History is a nice-to-have, so ignore it.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function addRecentlyViewedPlace(place: Omit<RecentlyViewedPlace, "viewedAt">) {
  write(addRecentlyViewed(getSnapshot(), { ...place, viewedAt: Date.now() }));
}

export function clearRecentlyViewed() {
  write([]);
}

export function useRecentlyViewed() {
  const places = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { places, addPlace: addRecentlyViewedPlace, clear: clearRecentlyViewed };
}
