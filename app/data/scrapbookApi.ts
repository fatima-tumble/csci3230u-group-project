import { supabase } from "../lib/supabase";
import { parseDoc, type ScrapbookDoc } from "./scrapbook";

export type Scrapbook = {
  id: string
  user_id: string
  title: string
  data: ScrapbookDoc
  thumbnail_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export type ScrapbookSummary = Pick<Scrapbook, "id" | "title" | "thumbnail_url" | "is_public" | "updated_at">

function client() {
  if (!supabase) throw new Error("Accounts aren't set up yet.");
  return supabase;
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function fetchScrapbooks(userId: string): Promise<ScrapbookSummary[]> {
  const { data, error } = await client()
    .from("scrapbooks")
    .select("id, title, thumbnail_url, is_public, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  fail(error);
  return (data ?? []) as ScrapbookSummary[];
}

export async function fetchScrapbook(id: string): Promise<Scrapbook | null> {
  const { data, error } = await client().from("scrapbooks").select("*").eq("id", id).maybeSingle();
  fail(error);
  if (!data) return null;
  return { ...(data as Scrapbook), data: parseDoc({ ...(data as Scrapbook).data, title: (data as Scrapbook).title }) };
}

async function uploadThumbnail(userId: string, scrapbookId: string, thumbnail: Blob | null) {
  if (!thumbnail) return null;
  const storage = client().storage.from("scrapbook-thumbnails");
  const path = `${userId}/${scrapbookId}.png`;
  const { error } = await storage.upload(path, thumbnail, { contentType: "image/png", upsert: true });
  if (error) return null; // a missing thumbnail shouldn't block saving
  // Cache-bust so the list shows the latest preview
  return `${storage.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
}

export async function saveScrapbook(opts: {
  userId: string
  id?: string
  doc: ScrapbookDoc
  isPublic: boolean
  thumbnail: Blob | null
}): Promise<string> {
  const { userId, doc, isPublic, thumbnail } = opts;
  const row = { title: doc.title.trim() || "Untitled scrapbook", data: doc, is_public: isPublic };

  let id = opts.id;
  if (id) {
    const { error } = await client().from("scrapbooks").update(row).eq("id", id);
    fail(error);
  } else {
    const { data, error } = await client().from("scrapbooks").insert({ ...row, user_id: userId }).select("id").single();
    fail(error);
    id = (data as { id: string }).id;
  }

  const thumbnailUrl = await uploadThumbnail(userId, id, thumbnail);
  if (thumbnailUrl) await client().from("scrapbooks").update({ thumbnail_url: thumbnailUrl }).eq("id", id);
  return id;
}

export async function deleteScrapbook(userId: string, id: string) {
  await client().storage.from("scrapbook-thumbnails").remove([`${userId}/${id}.png`]);
  const { error } = await client().from("scrapbooks").delete().eq("id", id);
  fail(error);
}
