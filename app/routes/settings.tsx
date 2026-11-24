import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Header from "../components/header";
import FormField from "../components/formField";
import Button from "../components/button";
import Avatar from "../components/avatar";
import { useAuth } from "../context/auth";
import {
  MAX_BIO,
  normalizeUsername,
  profileName,
  validateAvatarFile,
  validateBio,
  validateDisplayName,
  validatePassword,
  validateUsername,
} from "../data/profile";
import { changePassword, deleteAccount, removeOldAvatars, updateProfile, uploadAvatar } from "../data/profileApi";

export function meta() {
  return [{ title: "Settings · Wander" }];
}

function Section({ title, children, tone = "default" }: { title: string; children: React.ReactNode; tone?: "default" | "danger" }) {
  const id = `settings-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className={`rounded-2xl border bg-white p-6 sm:p-8 ${tone === "danger" ? "border-red-300" : "border-stone-300"}`}
    >
      <h2 id={id} className={`text-xl font-bold ${tone === "danger" ? "text-red-800" : ""}`}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusMessage({ status }: { status: { kind: "ok" | "error"; text: string } | null }) {
  if (!status) return null;
  return (
    <p role={status.kind === "error" ? "alert" : "status"} className={`text-sm font-semibold ${status.kind === "error" ? "text-red-700" : "text-green-800"}`}>
      {status.text}
    </p>
  );
}

type Status = { kind: "ok" | "error"; text: string } | null;

function ProfileForm() {
  const { user, profile, refreshProfile, isUsernameAvailable } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fill the form once the profile arrives
  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setUsername(profile?.username ?? "");
    setBio(profile?.bio ?? "");
  }, [profile?.id]);

  if (!user || !profile) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const next = {
      displayName: validateDisplayName(displayName),
      username: validateUsername(username),
      bio: validateBio(bio),
    };
    setErrors(next);
    setStatus(null);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      const name = normalizeUsername(username);
      if (name !== profile!.username && !(await isUsernameAvailable(name))) {
        setErrors({ username: "That username is taken. Try another." });
        return;
      }
      await updateProfile(user!.id, { display_name: displayName.trim() || null, username: name, bio: bio.trim() || null });
      await refreshProfile();
      setStatus({ kind: "ok", text: "Profile saved." });
    } catch (err) {
      setStatus({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function handleAvatar(file: File | undefined) {
    if (!file) return;
    const error = validateAvatarFile(file);
    if (error) {
      setStatus({ kind: "error", text: error });
      return;
    }
    setAvatarBusy(true);
    setStatus(null);
    try {
      const url = await uploadAvatar(user!.id, file);
      await updateProfile(user!.id, { avatar_url: url });
      await refreshProfile();
      setStatus({ kind: "ok", text: "Photo updated." });
    } catch (err) {
      setStatus({ kind: "error", text: (err as Error).message });
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    try {
      await removeOldAvatars(user!.id);
      await updateProfile(user!.id, { avatar_url: null });
      await refreshProfile();
      setStatus({ kind: "ok", text: "Photo removed." });
    } catch (err) {
      setStatus({ kind: "error", text: (err as Error).message });
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSave} className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={profileName(profile)} url={profile.avatar_url} size="lg" />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            id="avatar-input"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleAvatar(e.target.files?.[0])}
          />
          <Button variant="secondary" disabled={avatarBusy} onClick={() => fileRef.current?.click()}>
            {avatarBusy ? "Uploading…" : profile.avatar_url ? "Change photo" : "Upload photo"}
          </Button>
          {profile.avatar_url && (
            <Button variant="ghost" disabled={avatarBusy} onClick={handleRemoveAvatar}>Remove</Button>
          )}
        </div>
        <p className="w-full text-xs text-stone-600">JPG, PNG or GIF, up to 2 MB.</p>
      </div>
      <FormField label="Display name" value={displayName} onChange={setDisplayName} error={errors.displayName} autoComplete="name" maxLength={50} />
      <FormField label="Username" value={username} onChange={setUsername} error={errors.username} hint="Your profile lives at /u/username." autoComplete="username" maxLength={20} />
      <FormField
        label="Bio"
        value={bio}
        onChange={setBio}
        error={errors.bio}
        hint={`${bio.length}/${MAX_BIO}`}
        multiline
        maxLength={MAX_BIO}
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
        <StatusMessage status={status} />
      </div>
    </form>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = {
      password: validatePassword(password),
      confirm: password !== confirm ? "Passwords don't match." : null,
    };
    setErrors(next);
    setStatus(null);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    try {
      await changePassword(password);
      setPassword("");
      setConfirm("");
      setStatus({ kind: "ok", text: "Password changed." });
    } catch (err) {
      setStatus({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="New password" type="password" value={password} onChange={setPassword} error={errors.password} hint="At least 8 characters." autoComplete="new-password" />
      <FormField label="Confirm new password" type="password" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Change password"}</Button>
        <StatusMessage status={status} />
      </div>
    </form>
  );
}

function DeleteAccount() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  if (!user || !profile) return null;
  const matches = confirm.trim().toLowerCase() === profile.username;

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!matches) return;
    setBusy(true);
    try {
      await deleteAccount(user!.id);
      navigate("/");
    } catch (err) {
      setStatus({ kind: "error", text: (err as Error).message });
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={handleDelete} className="flex flex-col gap-4">
      <p className="text-sm text-stone-800">
        This permanently deletes your account, profile and everything you've posted. It can't be undone.
      </p>
      <FormField label={`Type ${profile.username} to confirm`} value={confirm} onChange={setConfirm} autoComplete="off" />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="danger" disabled={!matches || busy}>{busy ? "Deleting…" : "Delete my account"}</Button>
        <StatusMessage status={status} />
      </div>
    </form>
  );
}

export default function Settings() {
  const { enabled, loading, user, profile, openAuth } = useAuth();

  return <>
    <Header />
    <main className="mt-4 mb-12 flex flex-col gap-6 px-6 w-full max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Settings</h1>
      {!enabled ? (
        <p>Accounts aren't available right now.</p>
      ) : loading ? (
        <p role="status">Loading…</p>
      ) : !user ? (
        <div className="flex flex-col items-start gap-3">
          <p>Sign in to edit your profile and account.</p>
          <Button onClick={() => openAuth({ mode: "sign-in" })}>Sign in</Button>
        </div>
      ) : !profile ? (
        <p role="status">Loading your profile…</p>
      ) : (
        <>
          <Section title="Profile"><ProfileForm /></Section>
          <Section title="Password"><PasswordForm /></Section>
          <Section title="Delete account" tone="danger"><DeleteAccount /></Section>
        </>
      )}
    </main>
  </>;
}
