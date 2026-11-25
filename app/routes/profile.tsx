import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import type { Route } from "./+types/profile";
import Header from "../components/header";
import ProfileHeader from "../components/profileHeader";
import FollowButton from "../components/followButton";
import VisitList from "../components/visitList";
import Tabs, { type TabItem } from "../components/tabs";
import { useAuth } from "../context/auth";
import { usePagedVisits } from "../hooks/usePagedVisits";
import { fetchProfileByUsername } from "../data/profileApi";
import { fetchFollowStatus, fetchProfileStats, fetchUserVisits, follow, unfollow } from "../data/socialApi";
import { canSeePosts, pluralize, type FollowStatus, type ProfileStats } from "../data/social";
import type { Profile } from "../data/profile";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `@${params.username} · Wander` }];
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: Profile | null };

function Stats({ stats }: { stats: ProfileStats | null }) {
  if (!stats) return null;
  return (
    <p className="text-sm text-stone-700">
      <span className="font-bold text-stone-900">{pluralize(stats.visits, "visit")}</span>
      <span aria-hidden="true"> · </span>
      <span className="font-bold text-stone-900">{pluralize(stats.followers, "follower")}</span>
      <span aria-hidden="true"> · </span>
      <span className="font-bold text-stone-900">{stats.following}</span> following
    </p>
  );
}

function ProfileVisits({ profile, isOwn }: { profile: Profile; isOwn: boolean }) {
  const list = usePagedVisits((page) => fetchUserVisits(profile.id, page), `visits:${profile.id}`);
  return (
    <VisitList
      list={list}
      label={`${profile.username}'s visits`}
      showAuthor={false}
      empty={
        <p className="text-stone-700">
          {isOwn ? <>You haven't logged any visits yet. Open a place and press "I've been here".</> : "No visits yet."}
        </p>
      }
    />
  );
}

function PrivateNotice({ status }: { status: FollowStatus }) {
  return (
    <div className="rounded-2xl border border-stone-300 bg-white p-6 text-center">
      <p className="text-2xl" aria-hidden="true">🔒</p>
      <h2 className="mt-1 text-lg font-bold">This account is private</h2>
      <p className="text-stone-700">
        {status === "pending" ? "Your follow request is waiting for approval." : "Follow this account to see their visits."}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { username = "" } = useParams();
  const { enabled, user, openAuth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<State>({ status: "loading" });
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowStatus>("none");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState({ status: "loading" });
    setStats(null);
    fetchProfileByUsername(username)
      .then((profile) => { if (!cancelled) setState({ status: "ready", profile }); })
      .catch((err: Error) => { if (!cancelled) setState({ status: "error", message: err.message }); });
    return () => { cancelled = true; };
  }, [enabled, username, reload]);

  const profile = state.status === "ready" ? state.profile : null;

  // Counts and follow status load separately so the page appears quickly
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    fetchProfileStats(profile.id).then((s) => { if (!cancelled) setStats(s); }).catch(() => {});
    if (user && user.id !== profile.id) {
      fetchFollowStatus(user.id, profile.id).then((s) => { if (!cancelled) setFollowStatus(s); }).catch(() => {});
    } else {
      setFollowStatus("none");
    }
    return () => { cancelled = true; };
  }, [profile?.id, user?.id]);

  async function refreshStats() {
    if (profile) setStats(await fetchProfileStats(profile.id));
  }

  async function handleFollow() {
    if (!profile) return;
    if (!user) {
      openAuth({ reason: `Sign in to follow @${profile.username}.` });
      return;
    }
    setFollowStatus(await follow(user.id, profile.id));
    await refreshStats();
  }

  async function handleUnfollow() {
    if (!user || !profile) return;
    await unfollow(user.id, profile.id);
    setFollowStatus("none");
    await refreshStats();
  }

  function renderProfile(profile: Profile) {
    const isOwn = user?.id === profile.id;
    const visible = canSeePosts({ isOwnProfile: isOwn, isPrivate: !!profile.is_private, followStatus });
    const tabs: TabItem[] = [
      { id: "visits", label: "Visits", content: <ProfileVisits profile={profile} isOwn={isOwn} /> },
    ];

    return (
      <div className="flex flex-col gap-8">
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwn}
          stats={<Stats stats={stats} />}
          actions={!isOwn && (
            <FollowButton
              status={followStatus}
              isPrivate={!!profile.is_private}
              username={profile.username}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          )}
        />
        {visible ? (
          <Tabs
            label="Profile sections"
            items={tabs}
            active={searchParams.get("tab") ?? "visits"}
            onChange={(id) => setSearchParams(id === "visits" ? {} : { tab: id }, { replace: true })}
          />
        ) : (
          <PrivateNotice status={followStatus} />
        )}
      </div>
    );
  }

  return <>
    <Header />
    <main className="mt-4 mb-12 px-6 w-full max-w-4xl mx-auto">
      {!enabled ? (
        <p className="text-lg font-bold">Profiles aren't available right now.</p>
      ) : state.status === "loading" ? (
        <p role="status" className="text-lg font-bold">Loading profile…</p>
      ) : state.status === "error" ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-lg font-bold">Couldn't load this profile.</p>
          <p className="text-sm text-stone-700">{state.message}</p>
          <button type="button" onClick={() => setReload((n) => n + 1)} className="font-bold underline">Try again</button>
        </div>
      ) : !state.profile ? (
        <div className="flex flex-col items-start gap-3">
          <h1 className="text-2xl font-bold">No one here</h1>
          <p className="text-stone-700">There's no Wander user called @{username}.</p>
          <Link to="/" className="font-bold underline">Back to home</Link>
        </div>
      ) : (
        renderProfile(state.profile)
      )}
    </main>
  </>;
}
