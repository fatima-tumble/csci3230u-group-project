import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/auth";
import Avatar from "./avatar";
import Button from "./button";
import { profileName } from "../data/profile";
import { timeAgo, type FollowRequest } from "../data/social";
import { acceptFollowRequest, declineFollowRequest, fetchFollowRequests, setAccountPrivate } from "../data/socialApi";

// Private account switch + incoming follow requests
export default function PrivacySettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [requests, setRequests] = useState<FollowRequest[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchFollowRequests(user.id).then(setRequests).catch((err: Error) => setError(err.message));
  }, [user?.id, profile?.is_private]);

  if (!user || !profile) return null;
  const isPrivate = !!profile.is_private;

  async function togglePrivate(next: boolean) {
    setSaving(true);
    setError(null);
    try {
      await setAccountPrivate(user!.id, next);
      await refreshProfile();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function respond(followerId: string, accept: boolean) {
    try {
      if (accept) await acceptFollowRequest(user!.id, followerId);
      else await declineFollowRequest(user!.id, followerId);
      setRequests((prev) => prev?.filter((r) => r.follower_id !== followerId) ?? null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          role="switch"
          checked={isPrivate}
          disabled={saving}
          onChange={(e) => togglePrivate(e.target.checked)}
          className="mt-1 h-5 w-5 accent-brand-dark"
        />
        <span>
          <span className="block font-semibold">Private account</span>
          <span className="block text-sm text-stone-700">
            Only people you approve can follow you and see your visits. Turning this off approves any waiting requests.
          </span>
        </span>
      </label>

      <section aria-labelledby="requests-heading" id="requests">
        <h3 id="requests-heading" className="font-bold">
          Follow requests{requests && requests.length > 0 ? ` (${requests.length})` : ""}
        </h3>
        {!requests ? (
          <p role="status" className="mt-2 text-sm text-stone-700">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="mt-2 text-sm text-stone-700">No requests right now.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {requests.map((r) => r.follower && (
              <li key={r.follower_id} className="flex flex-wrap items-center gap-3">
                <Avatar name={profileName(r.follower)} url={r.follower.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link to={`/u/${r.follower.username}`} className="font-semibold hover:underline">{profileName(r.follower)}</Link>
                  <span className="text-sm text-stone-600"> @{r.follower.username} · {timeAgo(r.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  <Button className="px-4 py-1.5" onClick={() => respond(r.follower_id, true)} aria-label={`Approve @${r.follower.username}`}>Approve</Button>
                  <Button variant="secondary" className="px-4 py-1.5" onClick={() => respond(r.follower_id, false)} aria-label={`Decline @${r.follower.username}`}>Decline</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
