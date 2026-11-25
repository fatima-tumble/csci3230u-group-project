import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { friendlyAuthError, normalizeUsername, type Profile } from "../data/profile";

export type AuthMode = "sign-in" | "sign-up" | "forgot";

type OpenAuthOptions = {
  mode?: AuthMode
  // Shown at the top of the dialog, e.g. "Create a free account to save your scrapbook"
  reason?: string
  // Runs once the user is signed in, so the thing they were trying to do can carry on
  onSuccess?: () => void
}

type AuthResult = { error: string | null }
type SignUpResult = AuthResult & { needsConfirmation: boolean }

type AuthContextValue = {
  enabled: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (input: { email: string; password: string; username: string }) => Promise<SignUpResult>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<AuthResult>
  isUsernameAvailable: (username: string) => Promise<boolean>
  // Auth dialog
  dialog: { open: boolean; mode: AuthMode; reason?: string }
  openAuth: (options?: OpenAuthOptions) => void
  closeAuth: () => void
  setAuthMode: (mode: AuthMode) => void
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Remembers that someone has signed in on this device, so the dialog opens on
// "Sign in" for returning users and "Create account" for everyone else.
const HAS_ACCOUNT_KEY = "wander:has-account";

function hasAccountOnDevice() {
  try {
    return localStorage.getItem(HAS_ACCOUNT_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberAccountOnDevice() {
  try {
    localStorage.setItem(HAS_ACCOUNT_KEY, "1");
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(supabase !== null);
  const [dialog, setDialog] = useState<AuthContextValue["dialog"]>({ open: false, mode: "sign-in" });
  const pendingSuccess = useRef<(() => void) | null>(null);

  const user = session?.user ?? null;

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!supabase || !userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) rememberAccountOnDevice();
      // Don't await inside the callback: Supabase recommends deferring other calls
      setTimeout(() => loadProfile(next?.user.id), 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(user?.id), [loadProfile, user?.id]);

  const finishSignIn = useCallback(() => {
    rememberAccountOnDevice();
    const next = pendingSuccess.current;
    pendingSuccess.current = null;
    setDialog((d) => ({ ...d, open: false }));
    next?.();
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password) => {
    if (!supabase) return { error: "Accounts aren't set up yet." };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: friendlyAuthError(error.message) };
    finishSignIn();
    return { error: null };
  }, [finishSignIn]);

  const signUp = useCallback<AuthContextValue["signUp"]>(async ({ email, password, username }) => {
    if (!supabase) return { error: "Accounts aren't set up yet.", needsConfirmation: false };
    const name = normalizeUsername(username);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: name, display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: friendlyAuthError(error.message), needsConfirmation: false };
    // When "Confirm email" is on in Supabase, there's no session until they click the email link
    if (!data.session) return { error: null, needsConfirmation: true };
    finishSignIn();
    return { error: null, needsConfirmation: false };
  }, [finishSignIn]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const sendPasswordReset = useCallback<AuthContextValue["sendPasswordReset"]>(async (email) => {
    if (!supabase) return { error: "Accounts aren't set up yet." };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? friendlyAuthError(error.message) : null };
  }, []);

  const isUsernameAvailable = useCallback(async (username: string) => {
    if (!supabase) return true;
    const { data, error } = await supabase.rpc("username_available", { name: normalizeUsername(username) });
    return error ? true : Boolean(data); // if the check fails, let the database constraint decide
  }, []);

  const openAuth = useCallback((options: OpenAuthOptions = {}) => {
    pendingSuccess.current = options.onSuccess ?? null;
    setDialog({
      open: true,
      mode: options.mode ?? (hasAccountOnDevice() ? "sign-in" : "sign-up"),
      reason: options.reason,
    });
  }, []);

  const closeAuth = useCallback(() => {
    pendingSuccess.current = null;
    setDialog((d) => ({ ...d, open: false }));
  }, []);

  const setAuthMode = useCallback((mode: AuthMode) => setDialog((d) => ({ ...d, mode })), []);

  const value = useMemo<AuthContextValue>(() => ({
    enabled: supabase !== null,
    loading,
    session,
    user,
    profile,
    refreshProfile,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    isUsernameAvailable,
    dialog,
    openAuth,
    closeAuth,
    setAuthMode,
  }), [loading, session, user, profile, refreshProfile, signIn, signUp, signOut, sendPasswordReset, isUsernameAvailable, dialog, openAuth, closeAuth, setAuthMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
