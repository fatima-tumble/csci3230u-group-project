import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Header from "../components/header";
import FormField from "../components/formField";
import Button from "../components/button";
import { useAuth } from "../context/auth";
import { validatePassword } from "../data/profile";
import { changePassword } from "../data/profileApi";

export function meta() {
  return [{ title: "Choose a new password · Wander" }];
}

// The reset email links here. Supabase reads the token from the URL and signs the
// user in for this one purpose, so all that's left is choosing the new password.
export default function ResetPassword() {
  const { enabled, loading, user, openAuth } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = {
      password: validatePassword(password),
      confirm: password !== confirm ? "Passwords don't match." : null,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    setFormError(null);
    try {
      await changePassword(password);
      navigate("/settings");
    } catch (err) {
      setFormError((err as Error).message);
      setBusy(false);
    }
  }

  return <>
    <Header />
    <main className="mt-4 mb-12 px-6 w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      {!enabled ? (
        <p className="mt-4">Accounts aren't available right now.</p>
      ) : loading ? (
        <p role="status" className="mt-4">Checking your link…</p>
      ) : !user ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p>This reset link is invalid or has expired.</p>
          <Button onClick={() => openAuth({ mode: "forgot" })}>Send a new link</Button>
          <Link to="/" className="font-bold underline">Back to home</Link>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-2xl border border-stone-300 bg-white p-6">
          <FormField label="New password" type="password" value={password} onChange={setPassword} error={errors.password} hint="At least 8 characters." autoComplete="new-password" autoFocus />
          <FormField label="Confirm new password" type="password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
          {formError && <p role="alert" className="text-sm font-semibold text-red-700">{formError}</p>}
          <Button type="submit" disabled={busy} className="w-full py-3">{busy ? "Saving…" : "Save new password"}</Button>
        </form>
      )}
    </main>
  </>;
}
