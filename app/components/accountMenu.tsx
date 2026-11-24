import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/auth";
import { profileName } from "../data/profile";
import Avatar from "./avatar";

type AccountMenuItem = { to: string; label: string }

// Header account area: a "Sign in" button for guests, an avatar menu for signed-in users
export default function AccountMenu() {
  const { enabled, loading, user, profile, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close on navigation, outside clicks and Escape
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!enabled || loading) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuth()}
        className="inline-flex items-center rounded-full bg-brand-dark px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Sign in
      </button>
    );
  }

  const name = profile ? profileName(profile) : user.email ?? "Account";
  const items: AccountMenuItem[] = [
    ...(profile ? [{ to: `/u/${profile.username}`, label: "Profile" }] : []),
    { to: "/settings", label: "Settings" },
  ];

  const itemClasses = "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-900 hover:bg-bone focus-visible:outline-2 focus-visible:outline-brand";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={`Account menu for ${name}`}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full p-1 hover:bg-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Avatar name={name} url={profile?.avatar_url} size="sm" />
        <span aria-hidden="true" className="text-xs text-stone-700">▾</span>
      </button>
      {open && (
        <div id="account-menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <p className="truncate px-3 pb-2 pt-1 text-xs text-stone-600">
            Signed in as <span className="font-semibold text-stone-900">{profile ? `@${profile.username}` : name}</span>
          </p>
          <ul>
            {items.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={itemClasses}>{item.label}</Link>
              </li>
            ))}
            <li className="mt-1 border-t border-stone-200 pt-1">
              <button
                type="button"
                className={itemClasses}
                onClick={async () => {
                  await signOut();
                  setOpen(false);
                  navigate("/");
                }}
              >
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
