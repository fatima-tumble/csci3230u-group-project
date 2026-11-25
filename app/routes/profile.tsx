import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/profile";
import Header from "../components/header";
import ProfileHeader from "../components/profileHeader";
import { useAuth } from "../context/auth";
import { fetchProfileByUsername } from "../data/profileApi";
import type { Profile } from "../data/profile";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `@${params.username} · Wander` }];
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: Profile | null };

export default function ProfilePage() {
  const { username = "" } = useParams();
  const { enabled, user } = useAuth();
  const [state, setState] = useState<State>({ status: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState({ status: "loading" });
    fetchProfileByUsername(username)
      .then((profile) => { if (!cancelled) setState({ status: "ready", profile }); })
      .catch((err: Error) => { if (!cancelled) setState({ status: "error", message: err.message }); });
    return () => { cancelled = true; };
  }, [enabled, username, reload]);

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
        <ProfileHeader profile={state.profile} isOwnProfile={user?.id === state.profile.id} />
      )}
    </main>
  </>;
}
