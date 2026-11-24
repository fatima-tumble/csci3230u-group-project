import { useState } from "react";
import Button from "./button";
import type { FollowStatus } from "../data/social";

type followButtonProps = {
  status: FollowStatus
  isPrivate: boolean
  username: string
  onFollow: () => Promise<void>
  onUnfollow: () => Promise<void>
}

// Follow → (Requested for private accounts) → Following. Hovering/focusing "Following" offers to unfollow.
export default function FollowButton({ status, isPrivate, username, onFollow, onUnfollow }: followButtonProps) {
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  if (status === "none") {
    return (
      <Button disabled={busy} onClick={() => run(onFollow)}>
        {isPrivate ? "Request to follow" : "Follow"}
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button variant="secondary" disabled={busy} onClick={() => run(onUnfollow)} aria-label={`Cancel follow request to @${username}`}>
        Requested
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      disabled={busy}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onClick={() => run(onUnfollow)}
      aria-label={`Unfollow @${username}`}
    >
      {hover ? "Unfollow" : "Following"}
    </Button>
  );
}
