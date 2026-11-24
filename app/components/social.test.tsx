import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import FollowButton from "./followButton";
import VisitCard from "./visitCard";
import RatingInput from "./ratingInput";
import type { Visit } from "../data/social";

const visit: Visit = {
  id: "v1",
  user_id: "u1",
  xid: "W32742038",
  place_name: "CN Tower",
  place_image: null,
  rating: 8,
  visited_on: "2026-11-20",
  blurb: "great view, windy",
  photos: ["https://example.com/a.jpg"],
  visibility: "public",
  created_at: new Date().toISOString(),
  author: { username: "julian", display_name: "Julian", avatar_url: null },
  companions: [{ profile: { username: "vince", display_name: null, avatar_url: null } }],
};

function renderCard(props: Partial<React.ComponentProps<typeof VisitCard>> = {}) {
  return render(<MemoryRouter><ul><VisitCard visit={visit} {...props} /></ul></MemoryRouter>);
}

describe("VisitCard", () => {
  it("shows who went where, the rating, blurb, photo and tags", () => {
    renderCard();
    expect(screen.getByRole("link", { name: "CN Tower" }).getAttribute("href")).toBe("/places/W32742038");
    expect(screen.getByText(/8/).textContent).toContain("/10");
    expect(screen.getByText("great view, windy")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Photo 1 from Julian's visit to CN Tower/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "@vince" }).getAttribute("href")).toBe("/u/vince");
  });

  it("only lets the author delete, after confirming", async () => {
    const onDelete = vi.fn(async () => {});
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderCard({ currentUsername: "someone_else", onDelete });
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();

    renderCard({ currentUsername: "julian", onDelete });
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(visit));
    expect(confirm).toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("lets a tagged person remove their tag", async () => {
    const onRemoveTag = vi.fn(async () => {});
    renderCard({ currentUsername: "vince", onRemoveTag });
    fireEvent.click(screen.getByRole("button", { name: "Remove my tag" }));
    await waitFor(() => expect(onRemoveTag).toHaveBeenCalled());
  });
});

describe("FollowButton", () => {
  const noop = async () => {};

  it("says 'Request to follow' for private accounts", () => {
    render(<FollowButton status="none" isPrivate username="bob" onFollow={noop} onUnfollow={noop} />);
    expect(screen.getByRole("button", { name: "Request to follow" })).toBeTruthy();
  });

  it("follows, and offers to unfollow once following", async () => {
    const onFollow = vi.fn(async () => {});
    const onUnfollow = vi.fn(async () => {});
    const { rerender } = render(<FollowButton status="none" isPrivate={false} username="bob" onFollow={onFollow} onUnfollow={onUnfollow} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Follow" })));
    expect(onFollow).toHaveBeenCalled();

    rerender(<FollowButton status="following" isPrivate={false} username="bob" onFollow={onFollow} onUnfollow={onUnfollow} />);
    const button = screen.getByRole("button", { name: "Unfollow @bob" });
    expect(button.textContent).toBe("Following");
    fireEvent.mouseEnter(button);
    expect(button.textContent).toBe("Unfollow");
    await act(async () => fireEvent.click(button));
    expect(onUnfollow).toHaveBeenCalled();
  });

  it("lets people cancel a pending request", () => {
    render(<FollowButton status="pending" isPrivate username="bob" onFollow={noop} onUnfollow={noop} />);
    expect(screen.getByRole("button", { name: "Cancel follow request to @bob" }).textContent).toBe("Requested");
  });
});

describe("RatingInput", () => {
  it("is a labelled radio group from 1 to 10", () => {
    const onChange = vi.fn();
    render(<RatingInput value={null} onChange={onChange} />);
    expect(screen.getByRole("group", { name: /Rating/ })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(10);
    fireEvent.click(screen.getByRole("radio", { name: "7" }));
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("shows errors", () => {
    render(<RatingInput value={null} onChange={() => {}} error="Pick a rating from 1 to 10." />);
    expect(screen.getByText("Pick a rating from 1 to 10.")).toBeTruthy();
  });
});
