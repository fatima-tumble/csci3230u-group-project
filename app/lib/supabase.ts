import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// The anon key is meant to be public: Row Level Security policies in supabase/migrations
// decide what each user can read and write. Without these env vars the app still runs,
// it just hides account features.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;
