import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { api, authState } = vi.hoisted(() => ({
  api: {
    fetchFollowing: vi.fn(async () => [{ id: "u2", username: "vince", display_name: "Vince", avatar_url: null }]),
    createVisit: vi.fn(async () => "new-visit"),
  },
  authState: { profile: { username: "julian", is_private: false } as { username: string; is_private: boolean } },
}));

vi.mock("../data/socialApi", () => api);
vi.mock("../context/auth", () => ({
  useAuth: () => ({ user: { id: "u1" }, profile: authState.profile }),
}));

import VisitDialog from "./visitDialog";

const place = { xid: "W1", name: "CN Tower", image: "https://example.com/cn.jpg" };

beforeEach(() => {
  vi.clearAllMocks();
  authState.profile = { username: "julian", is_private: false };
});

describe("VisitDialog", () => {
  it("requires a rating before posting", async () => {
    render(<VisitDialog place={place} open onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    expect(await screen.findByText("Pick a rating from 1 to 10.")).toBeTruthy();
    expect(api.createVisit).not.toHaveBeenCalled();
  });

  it("counts blurb characters as you type", () => {
    render(<VisitDialog place={place} open onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText("What was it like?"), { target: { value: "windy!" } });
    expect(screen.getByText("6/280")).toBeTruthy();
  });

  it("posts the visit with rating, blurb, tags and visibility, then closes", async () => {
    const onClose = vi.fn();
    const onPosted = vi.fn();
    render(<VisitDialog place={place} open onClose={onClose} onPosted={onPosted} />);

    fireEvent.click(screen.getByRole("radio", { name: "9" }));
    fireEvent.change(screen.getByLabelText("What was it like?"), { target: { value: "great view" } });
    fireEvent.click(await screen.findByRole("checkbox", { name: /Vince/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Everyone" }));
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onPosted).toHaveBeenCalled();
    expect(api.createVisit).toHaveBeenCalledWith("u1", expect.objectContaining({
      xid: "W1",
      placeName: "CN Tower",
      rating: 9,
      blurb: "great view",
      visibility: "public",
      companionIds: ["u2"],
    }));
  });

  it("hides the visibility choice for private accounts and posts to followers only", async () => {
    authState.profile = { username: "julian", is_private: true };
    render(<VisitDialog place={place} open onClose={() => {}} />);
    expect(screen.queryByRole("radio", { name: "Everyone" })).toBeNull();
    expect(screen.getByText(/only your approved followers/)).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    await waitFor(() => expect(api.createVisit).toHaveBeenCalledWith("u1", expect.objectContaining({ visibility: "followers" })));
  });

  it("shows an error if posting fails", async () => {
    api.createVisit.mockRejectedValueOnce(new Error("Network down"));
    render(<VisitDialog place={place} open onClose={() => {}} />);
    fireEvent.click(screen.getByRole("radio", { name: "6" }));
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Network down");
  });
});
