import { describe, expect, it } from "vitest";
import {
  friendlyAuthError,
  initialsFor,
  profileName,
  validateAvatarFile,
  validateBio,
  validateEmail,
  validatePassword,
  validateUsername,
} from "./profile";

describe("validateUsername", () => {
  it("accepts letters, numbers and underscores, ignoring case and spaces around it", () => {
    expect(validateUsername("julian_c")).toBeNull();
    expect(validateUsername("  Julian_C  ")).toBeNull();
  });

  it("rejects empty, too short, too long and invalid characters", () => {
    expect(validateUsername("")).toMatch(/choose/i);
    expect(validateUsername("ab")).toMatch(/3 to 20/);
    expect(validateUsername("a".repeat(21))).toMatch(/3 to 20/);
    expect(validateUsername("no spaces")).toMatch(/letters, numbers/);
    expect(validateUsername("emoji😀")).toMatch(/letters, numbers/);
  });
});

describe("validateEmail / validatePassword / validateBio", () => {
  it("checks email format", () => {
    expect(validateEmail("a@b.co")).toBeNull();
    expect(validateEmail("")).toMatch(/enter your email/i);
    expect(validateEmail("not-an-email")).toMatch(/valid/);
  });

  it("requires passwords of at least 8 characters", () => {
    expect(validatePassword("12345678")).toBeNull();
    expect(validatePassword("short")).toMatch(/8/);
    expect(validatePassword("")).toMatch(/enter/i);
  });

  it("limits bios to 160 characters", () => {
    expect(validateBio("a".repeat(160))).toBeNull();
    expect(validateBio("a".repeat(161))).toMatch(/160/);
  });
});

describe("validateAvatarFile", () => {
  it("only accepts images up to 2 MB", () => {
    expect(validateAvatarFile(new File(["x"], "a.png", { type: "image/png" }))).toBeNull();
    expect(validateAvatarFile(new File(["x"], "a.pdf", { type: "application/pdf" }))).toMatch(/image/);
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    expect(validateAvatarFile(big)).toMatch(/2 MB/);
  });
});

describe("display helpers", () => {
  it("falls back to the username when there's no display name", () => {
    expect(profileName({ display_name: "Julian", username: "jc" })).toBe("Julian");
    expect(profileName({ display_name: "  ", username: "jc" })).toBe("jc");
    expect(profileName({ display_name: null, username: "jc" })).toBe("jc");
  });

  it("builds initials from names and usernames", () => {
    expect(initialsFor("Julian Cruzet")).toBe("JC");
    expect(initialsFor("julian_cruzet")).toBe("JC");
    expect(initialsFor("vince")).toBe("V");
  });

  it("rewrites common Supabase errors into plain language", () => {
    expect(friendlyAuthError("Invalid login credentials")).toMatch(/don't match/);
    expect(friendlyAuthError("User already registered")).toMatch(/already exists/);
    expect(friendlyAuthError("Database error saving new user")).toMatch(/username/);
    expect(friendlyAuthError("Something odd")).toBe("Something odd");
  });
});
