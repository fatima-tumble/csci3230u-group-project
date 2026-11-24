import { useEffect, useRef, useState } from "react";
import { useAuth, type AuthMode } from "../context/auth";
import FormField from "./formField";
import Button from "./button";
import { validateEmail, validatePassword, validateUsername } from "../data/profile";

type Errors = Partial<Record<"email" | "password" | "username" | "form", string | null>>;

const tabs: { mode: Exclude<AuthMode, "forgot">; label: string }[] = [
  { mode: "sign-in", label: "Sign in" },
  { mode: "sign-up", label: "Create account" },
];

// One dialog for signing in, creating an account and resetting a password.
// Opened from the header, or by features (like saving a scrapbook) that need an account.
export default function AuthDialog() {
  const { enabled, dialog, closeAuth, setAuthMode, signIn, signUp, sendPasswordReset, isUsernameAvailable } = useAuth();
  const ref = useRef<HTMLDialogElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const mode = dialog.mode;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (dialog.open && !el.open) el.showModal();
    if (!dialog.open && el.open) el.close();
  }, [dialog.open]);

  // Start fresh each time the dialog opens or switches mode
  useEffect(() => {
    setErrors({});
    setNotice(null);
    setPassword("");
  }, [dialog.open, mode]);

  if (!enabled) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Errors = { email: validateEmail(email) };
    if (mode !== "forgot") next.password = validatePassword(password);
    if (mode === "sign-in" && password) next.password = null; // don't enforce length rules on existing passwords
    if (mode === "sign-up") next.username = validateUsername(username);
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      if (mode === "sign-in") {
        const { error } = await signIn(email, password);
        if (error) setErrors({ form: error });
      } else if (mode === "sign-up") {
        if (!(await isUsernameAvailable(username))) {
          setErrors({ username: "That username is taken. Try another." });
          return;
        }
        const { error, needsConfirmation } = await signUp({ email, password, username });
        if (error) setErrors({ form: error });
        else if (needsConfirmation) setNotice(`Almost done! We sent a confirmation link to ${email.trim()}. Open it, then sign in.`);
      } else {
        const { error } = await sendPasswordReset(email);
        if (error) setErrors({ form: error });
        else setNotice(`If there's an account for ${email.trim()}, a reset link is on its way.`);
      }
    } finally {
      setBusy(false);
    }
  }

  function handleTabKey(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setAuthMode(next.mode);
    tabRefs.current[next.mode]?.focus();
  }

  const title = mode === "forgot" ? "Reset your password" : mode === "sign-up" ? "Create your account" : "Welcome back";
  const submitLabel = mode === "forgot" ? "Send reset link" : mode === "sign-up" ? "Create account" : "Sign in";

  return (
    <dialog
      ref={ref}
      aria-labelledby="auth-dialog-title"
      onClose={closeAuth}
      onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-bone p-0 text-stone-900 shadow-xl backdrop:bg-stone-900/50"
    >
      <div className="relative p-6 sm:p-8">
        <button
          type="button"
          onClick={closeAuth}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-xl leading-none hover:bg-stone-900/5 focus-visible:outline-2 focus-visible:outline-brand"
        >
          <span aria-hidden="true">×</span>
        </button>

        <h2 id="auth-dialog-title" className="pr-8 text-2xl font-bold">{title}</h2>
        {dialog.reason && mode !== "forgot" && (
          <p className="mt-1 text-sm text-stone-700">{dialog.reason}</p>
        )}

        {mode !== "forgot" && (
          <div role="tablist" aria-label="Account" className="mt-5 grid grid-cols-2 rounded-full bg-white p-1">
            {tabs.map((tab, index) => (
              <button
                key={tab.mode}
                ref={(el) => { tabRefs.current[tab.mode] = el; }}
                type="button"
                role="tab"
                id={`auth-tab-${tab.mode}`}
                aria-selected={mode === tab.mode}
                aria-controls="auth-panel"
                tabIndex={mode === tab.mode ? 0 : -1}
                onClick={() => setAuthMode(tab.mode)}
                onKeyDown={(e) => handleTabKey(e, index)}
                className={`rounded-full py-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                  mode === tab.mode ? "bg-brand-dark text-white" : "text-stone-800 hover:bg-stone-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div
          id="auth-panel"
          role={mode === "forgot" ? undefined : "tabpanel"}
          aria-labelledby={mode === "forgot" ? undefined : `auth-tab-${mode}`}
          className="mt-5"
        >
          {notice ? (
            <div className="flex flex-col gap-4">
              <p role="status" className="rounded-lg bg-white p-4 text-sm">{notice}</p>
              <Button variant="secondary" onClick={() => setAuthMode("sign-in")}>Back to sign in</Button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "forgot" && (
                <p className="text-sm text-stone-700">Enter your email and we'll send you a link to choose a new password.</p>
              )}
              {mode === "sign-up" && (
                <FormField
                  label="Username"
                  value={username}
                  onChange={setUsername}
                  error={errors.username}
                  hint="3–20 characters: letters, numbers and underscores."
                  autoComplete="username"
                  maxLength={20}
                  required
                />
              )}
              <FormField label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" required />
              {mode !== "forgot" && (
                <FormField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  error={errors.password}
                  hint={mode === "sign-up" ? "At least 8 characters." : undefined}
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  required
                />
              )}
              {mode === "sign-in" && (
                <button
                  type="button"
                  onClick={() => setAuthMode("forgot")}
                  className="self-start text-sm font-semibold text-stone-800 underline underline-offset-2 hover:text-stone-950"
                >
                  Forgot password?
                </button>
              )}
              {errors.form && <p role="alert" className="text-sm font-semibold text-red-700">{errors.form}</p>}
              <Button type="submit" disabled={busy} className="mt-1 w-full py-3">
                {busy ? "Please wait…" : submitLabel}
              </Button>
              {mode === "forgot" && (
                <button
                  type="button"
                  onClick={() => setAuthMode("sign-in")}
                  className="text-sm font-semibold text-stone-800 underline underline-offset-2 hover:text-stone-950"
                >
                  Back to sign in
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}
