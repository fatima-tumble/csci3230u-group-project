export type Profile = {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const MAX_DISPLAY_NAME = 50;
export const MAX_BIO = 160;
export const MIN_PASSWORD = 8;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

// Each validator returns an error message, or null when the value is fine
export function validateUsername(value: string): string | null {
  const name = normalizeUsername(value);
  if (!name) return "Choose a username.";
  if (name.length < 3 || name.length > 20) return "Usernames are 3 to 20 characters.";
  if (!USERNAME_PATTERN.test(name)) return "Use only letters, numbers and underscores.";
  return null;
}

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Enter a password.";
  if (value.length < MIN_PASSWORD) return `Passwords need at least ${MIN_PASSWORD} characters.`;
  return null;
}

export function validateDisplayName(value: string): string | null {
  if (value.trim().length > MAX_DISPLAY_NAME) return `Keep it under ${MAX_DISPLAY_NAME} characters.`;
  return null;
}

export function validateBio(value: string): string | null {
  if (value.length > MAX_BIO) return `Bios are limited to ${MAX_BIO} characters.`;
  return null;
}

export function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Choose an image file.";
  if (file.size > MAX_AVATAR_BYTES) return "Images must be 2 MB or smaller.";
  return null;
}

export function profileName(profile: Pick<Profile, "display_name" | "username">) {
  return profile.display_name?.trim() || profile.username;
}

export function initialsFor(name: string) {
  return name
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Turns Supabase auth errors into messages that make sense to people
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match.";
  if (m.includes("email not confirmed")) return "Confirm your email first. Check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with that email already exists. Try signing in.";
  if (m.includes("database error saving new user")) return "That username was just taken. Try another.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("password should be")) return `Passwords need at least ${MIN_PASSWORD} characters.`;
  return message;
}
