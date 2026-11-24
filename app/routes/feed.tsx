import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Header from "../components/header";
import Button from "../components/button";
import VisitList from "../components/visitList";
import { useAuth } from "../context/auth";
import { usePagedVisits } from "../hooks/usePagedVisits";
import { fetchFriendsFeed, fetchPopularPlaces, fetchPublicVisits } from "../data/socialApi";
import { pluralize, type PopularPlace } from "../data/social";

export function meta() {
  return [{ title: "Feed · Wander" }, { name: "description", content: "See where your friends have been." }];
}

const tabs = [
  { id: "friends", label: "Friends" },
  { id: "explore", label: "Explore" },
] as const;
type TabId = (typeof tabs)[number]["id"];

function FriendsTab() {
  const { user, openAuth } = useAuth();
  const list = usePagedVisits(user ? (page) => fetchFriendsFeed(user.id, page) : null, `friends:${user?.id ?? ""}`);

  if (!user) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-stone-300 bg-white p-6">
        <h2 className="text-xl font-bold">See where your friends have been</h2>
        <p className="text-stone-700">Sign in to follow people and see their visits here.</p>
        <Button onClick={() => openAuth({ reason: "Sign in to see your friends' visits." })}>Sign in</Button>
      </div>
    );
  }

  return (
    <VisitList
      list={list}
      label="Posts from people you follow"
      empty={
        <div className="rounded-2xl border border-stone-300 bg-white p-6">
          <h2 className="text-xl font-bold">Nothing here yet</h2>
          <p className="mt-1 text-stone-700">When people you follow log visits, they'll show up here. Find people in the Explore tab.</p>
        </div>
      }
    />
  );
}

function PopularPlaces() {
  const [places, setPlaces] = useState<PopularPlace[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchPopularPlaces()
      .then((p) => { if (!cancelled) setPlaces(p); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (failed || (places && places.length === 0)) return null;

  return (
    <section aria-labelledby="popular-heading" className="mb-8">
      <h2 id="popular-heading" className="text-xl font-bold">Popular this month</h2>
      {!places ? (
        <p role="status" className="mt-2 text-stone-700">Loading…</p>
      ) : (
        <ul className="mt-3 flex gap-4 overflow-x-auto snap-x pb-3">
          {places.map((place) => (
            <li key={place.xid} className="w-44 shrink-0 snap-start">
              <Link to={`/places/${place.xid}`} className="flex h-full flex-col overflow-hidden rounded-[10px] border border-stone-300 bg-white hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                <div className="aspect-4/3 w-full bg-stone-100">
                  {place.place_image && <img src={place.place_image.replace(/\/\d+px-/, "/330px-")} alt="" loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <span className="text-sm font-semibold leading-tight line-clamp-2">{place.place_name}</span>
                  <span className="text-xs text-stone-600">{pluralize(place.visit_count, "visit")} · {place.avg_rating}/10 avg</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ExploreTab() {
  const list = usePagedVisits(fetchPublicVisits, "explore");
  return (
    <>
      <PopularPlaces />
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 text-xl font-bold">Recent public posts</h2>
        <VisitList
          list={list}
          label="Recent public posts"
          empty={<p className="text-stone-700">No public posts yet. Be the first: open a place and press "I've been here".</p>}
        />
      </section>
    </>
  );
}

export default function Feed() {
  const { enabled } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const active: TabId = searchParams.get("tab") === "explore" ? "explore" : "friends";
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(id: TabId) {
    setSearchParams(id === "friends" ? {} : { tab: id }, { replace: true });
  }

  function handleKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    select(next.id);
    tabRefs.current[next.id]?.focus();
  }

  return <>
    <Header />
    <main className="mt-4 mb-12 px-6 w-full max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Feed</h1>
      {!enabled ? (
        <p className="mt-4">The feed isn't available right now.</p>
      ) : (
        <>
          <div role="tablist" aria-label="Feed" className="mt-4 mb-6 inline-grid grid-cols-2 rounded-full bg-white p-1">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                type="button"
                role="tab"
                id={`feed-tab-${tab.id}`}
                aria-selected={active === tab.id}
                aria-controls="feed-panel"
                tabIndex={active === tab.id ? 0 : -1}
                onClick={() => select(tab.id)}
                onKeyDown={(e) => handleKey(e, index)}
                className={`rounded-full px-6 py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                  active === tab.id ? "bg-brand-dark text-white" : "text-stone-800 hover:bg-stone-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div id="feed-panel" role="tabpanel" aria-labelledby={`feed-tab-${active}`}>
            {active === "friends" ? <FriendsTab /> : <ExploreTab />}
          </div>
        </>
      )}
    </main>
  </>;
}
