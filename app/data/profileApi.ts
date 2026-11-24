import { supabase } from "../lib/supabase";
import { normalizeUsername, type Profile } from "./profile";

function client() {
  if (!supabase) throw new Error("Accounts aren't set up yet.");
  return supabase;
}

export async function fetchProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await client()
    .from("profiles")
    .select("*")
    .eq("username", normalizeUsername(username))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export type ProfileUpdate = Partial<Pick<Profile, "username" | "display_name" | "bio" | "avatar_url">>

export async function updateProfile(userId: string, changes: ProfileUpdate): Promise<void> {
  const { error } = await client().from("profiles").update(changes).eq("id", userId);
  if (error) {
    if (error.code === "23505") throw new Error("That username is taken. Try another.");
    throw new Error(error.message);
  }
}

// Avatars live at avatars/<user id>/<timestamp>.<ext>. A new file name each time
// means browsers and CDNs never show a stale cached image.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const storage = client().storage.from("avatars");
  const { error } = await storage.upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  await removeOldAvatars(userId, path);
  return storage.getPublicUrl(path).data.publicUrl;
}

export async function removeOldAvatars(userId: string, keepPath?: string) {
  const storage = client().storage.from("avatars");
  const { data } = await storage.list(userId);
  const stale = (data ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keepPath);
  if (stale.length) await storage.remove(stale);
}

export async function changePassword(password: string): Promise<void> {
  const { error } = await client().auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function deleteAccount(userId: string): Promise<void> {
  // Storage files can't be removed from SQL, so clear them first
  await removeOldAvatars(userId);
  const { error } = await client().rpc("delete_account");
  if (error) throw new Error(error.message);
  await client().auth.signOut();
}
