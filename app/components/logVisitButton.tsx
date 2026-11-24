import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/auth";
import Button from "./button";
import VisitDialog, { type VisitPlace } from "./visitDialog";

// "I've been here" on a place's details page. Guests are asked to sign in first,
// then the form opens straight away.
export default function LogVisitButton({ place }: { place: VisitPlace }) {
  const { enabled, user, profile, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [posted, setPosted] = useState(false);

  if (!enabled) return null;

  function handleClick() {
    if (user) setOpen(true);
    else openAuth({ reason: `Sign in to log your visit to ${place.name}.`, onSuccess: () => setOpen(true) });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button onClick={handleClick}>
        <span aria-hidden="true">✓</span> I've been here
      </Button>
      {posted && (
        <p role="status" className="text-sm font-semibold text-green-800">
          Posted!{" "}
          {profile && <Link to={`/u/${profile.username}`} className="underline">See it on your profile</Link>}
        </p>
      )}
      {user && (
        <VisitDialog place={place} open={open} onClose={() => setOpen(false)} onPosted={() => setPosted(true)} />
      )}
    </div>
  );
}
