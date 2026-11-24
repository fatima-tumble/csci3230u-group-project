import { describe, expect, it } from "vitest";
import { canSeePosts, followStatusFrom, formatVisitDate, pluralize, timeAgo, todayISO, validateVisit } from "./social";

const img = (size = 10) => new File([new Uint8Array(size)], "p.jpg", { type: "image/jpeg" });

describe("validateVisit", () => {
  const base = { rating: 8, visitedOn: "2026-11-20", blurb: "", photos: [] as File[] };
  const today = "2026-11-23";

  it("accepts a normal visit", () => {
    expect(validateVisit(base, today)).toEqual({});
  });

  it("requires a whole rating from 1 to 10", () => {
    expect(validateVisit({ ...base, rating: null }, today).rating).toMatch(/pick/i);
    expect(validateVisit({ ...base, rating: 0 }, today).rating).toMatch(/1 to 10/);
    expect(validateVisit({ ...base, rating: 11 }, today).rating).toMatch(/1 to 10/);
    expect(validateVisit({ ...base, rating: 7.5 }, today).rating).toMatch(/1 to 10/);
  });

  it("rejects missing and future dates", () => {
    expect(validateVisit({ ...base, visitedOn: "" }, today).visitedOn).toBeTruthy();
    expect(validateVisit({ ...base, visitedOn: "2026-11-24" }, today).visitedOn).toMatch(/future/);
    expect(validateVisit({ ...base, visitedOn: today }, today).visitedOn).toBeUndefined();
  });

  it("limits blurbs to 280 characters", () => {
    expect(validateVisit({ ...base, blurb: "a".repeat(280) }, today).blurb).toBeUndefined();
    expect(validateVisit({ ...base, blurb: "a".repeat(281) }, today).blurb).toMatch(/280/);
  });

  it("allows up to 4 image photos of 5 MB or less", () => {
    expect(validateVisit({ ...base, photos: [img(), img(), img(), img()] }, today).photos).toBeUndefined();
    expect(validateVisit({ ...base, photos: [img(), img(), img(), img(), img()] }, today).photos).toMatch(/4/);
    expect(validateVisit({ ...base, photos: [new File(["x"], "a.txt", { type: "text/plain" })] }, today).photos).toMatch(/images/);
    expect(validateVisit({ ...base, photos: [img(5 * 1024 * 1024 + 1)] }, today).photos).toMatch(/5 MB/);
  });
});

describe("follow helpers", () => {
  it("maps database rows to a follow status", () => {
    expect(followStatusFrom(null)).toBe("none");
    expect(followStatusFrom({ status: "pending" })).toBe("pending");
    expect(followStatusFrom({ status: "accepted" })).toBe("following");
  });

  it("only hides posts on private accounts you don't follow", () => {
    expect(canSeePosts({ isOwnProfile: false, isPrivate: false, followStatus: "none" })).toBe(true);
    expect(canSeePosts({ isOwnProfile: false, isPrivate: true, followStatus: "none" })).toBe(false);
    expect(canSeePosts({ isOwnProfile: false, isPrivate: true, followStatus: "pending" })).toBe(false);
    expect(canSeePosts({ isOwnProfile: false, isPrivate: true, followStatus: "following" })).toBe(true);
    expect(canSeePosts({ isOwnProfile: true, isPrivate: true, followStatus: "none" })).toBe(true);
  });
});

describe("formatting", () => {
  const now = new Date("2026-11-23T12:00:00Z").getTime();

  it("shows relative times", () => {
    expect(timeAgo("2026-11-23T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-11-23T11:15:00Z", now)).toBe("45m ago");
    expect(timeAgo("2026-11-23T09:00:00Z", now)).toBe("3h ago");
    expect(timeAgo("2026-11-21T12:00:00Z", now)).toBe("2d ago");
  });

  it("uses the local date for today and doesn't shift stored dates", () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatVisitDate("2026-01-05")).toContain("5");
  });

  it("pluralizes counts", () => {
    expect(pluralize(1, "visit")).toBe("1 visit");
    expect(pluralize(3, "visit")).toBe("3 visits");
    expect(pluralize(0, "follower")).toBe("0 followers");
  });
});
