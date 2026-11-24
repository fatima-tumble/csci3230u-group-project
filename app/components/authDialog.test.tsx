import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

// Fake Supabase client so the real AuthProvider + AuthDialog can be tested together
const { auth, rpc } = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(async () => ({ data: { session: null } })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
  rpc: vi.fn(async () => ({ data: true, error: null })),
}));

vi.mock("../lib/supabase", () => ({
  supabase: { auth, rpc, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) },
  isSupabaseConfigured: true,
}));

import { AuthProvider, useAuth } from "../context/auth";
import AuthDialog from "./authDialog";

let api: ReturnType<typeof useAuth>;
function Capture() {
  api = useAuth();
  return null;
}

async function renderDialog() {
  render(
    <AuthProvider>
      <Capture />
      <AuthDialog />
    </AuthProvider>,
  );
  await waitFor(() => expect(api.loading).toBe(false));
}

function type(label: RegExp | string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe("AuthDialog", () => {
  it("opens on 'Create account' for new visitors and 'Sign in' for returning ones", async () => {
    await renderDialog();
    act(() => api.openAuth());
    expect(screen.getByRole("tab", { name: "Create account" }).getAttribute("aria-selected")).toBe("true");

    act(() => api.closeAuth());
    localStorage.setItem("wander:has-account", "1");
    act(() => api.openAuth());
    expect(screen.getByRole("tab", { name: "Sign in" }).getAttribute("aria-selected")).toBe("true");
  });

  it("shows the reason it was opened", async () => {
    await renderDialog();
    act(() => api.openAuth({ reason: "Create a free account to save your scrapbook" }));
    expect(screen.getByText("Create a free account to save your scrapbook")).toBeTruthy();
  });

  it("validates fields before calling Supabase", async () => {
    await renderDialog();
    act(() => api.openAuth({ mode: "sign-up" }));
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect(await screen.findByText("Choose a username.")).toBeTruthy();
    expect(screen.getByText("Enter your email.")).toBeTruthy();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("signs in, closes, and resumes the action that needed an account", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    const onSuccess = vi.fn();
    await renderDialog();
    act(() => api.openAuth({ mode: "sign-in", onSuccess }));

    type("Email", "a@b.co");
    type("Password", "hunter22");
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "a@b.co", password: "hunter22" });
    expect(api.dialog.open).toBe(false);
  });

  it("shows a friendly error when sign in fails", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    await renderDialog();
    act(() => api.openAuth({ mode: "sign-in" }));
    type("Email", "a@b.co");
    type("Password", "wrongpass");
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toMatch(/don't match/);
  });

  it("blocks sign up when the username is taken", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    await renderDialog();
    act(() => api.openAuth({ mode: "sign-up" }));
    type("Username", "taken_name");
    type("Email", "a@b.co");
    type("Password", "longenough");
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect(await screen.findByText("That username is taken. Try another.")).toBeTruthy();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("tells people to confirm their email when Supabase requires it", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    await renderDialog();
    act(() => api.openAuth({ mode: "sign-up" }));
    type("Username", "New_User");
    type("Email", "new@b.co");
    type("Password", "longenough");
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    expect((await screen.findByRole("status")).textContent).toMatch(/confirmation link to new@b.co/);
    expect(auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: "new@b.co",
      options: expect.objectContaining({ data: { username: "new_user", display_name: "new_user" } }),
    }));
  });
});
