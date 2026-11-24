import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

const { auth, api } = vi.hoisted(() => ({
  auth: {
    enabled: true,
    loading: false,
    user: null as null | { id: string },
    openAuth: vi.fn(),
  },
  api: {
    saveScrapbook: vi.fn(async () => "saved-id"),
    fetchScrapbook: vi.fn(async () => null),
  },
}));

vi.mock("../context/auth", () => ({ useAuth: () => auth }));
vi.mock("../data/scrapbookApi", () => api);
vi.mock("../components/header", () => ({ default: () => null }));
// jsdom has no canvas, so stand in for the Konva page with a simple list
vi.mock("../components/scrapbook/scrapbookCanvas", () => ({
  default: forwardRef(function FakeCanvas({ doc }: { doc: { items: { id: string }[] } }, ref) {
    useImperativeHandle(ref, () => ({ toBlob: async () => new Blob(["png"], { type: "image/png" }) }));
    return <div data-testid="canvas">{doc.items.length} items</div>;
  }),
}));

import ScrapbookEditor from "./scrapbookEditor";

function renderEditor() {
  const router = createMemoryRouter(
    [
      { path: "/scrapbooks/new", element: <ScrapbookEditor /> },
      { path: "/scrapbooks/:id", element: <p>Opened saved scrapbook</p> },
    ],
    { initialEntries: ["/scrapbooks/new"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  auth.user = null;
});

describe("Scrapbook editor", () => {
  it("lets guests add stickers and keeps a draft on the device", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Add 🌮 sticker" }));
    expect(await screen.findByText("1 items")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Selected: Sticker 🌮" })).toBeTruthy();
    await waitFor(() => expect(localStorage.getItem("wander:scrapbook-draft")).toContain("🌮"));
  });

  it("asks guests to create an account when they save, then saves once they're signed in", async () => {
    const router = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Add ⭐ sticker" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(auth.openAuth).toHaveBeenCalledWith(expect.objectContaining({ reason: "Create a free account to save your scrapbook." }));
    expect(api.saveScrapbook).not.toHaveBeenCalled();

    // Simulate a successful sign-in from the dialog
    const { onSuccess } = auth.openAuth.mock.calls[0][0];
    auth.user = { id: "u1" };
    await act(async () => onSuccess());

    await waitFor(() => expect(api.saveScrapbook).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1", isPublic: false })));
    await waitFor(() => expect(router.state.location.pathname).toBe("/scrapbooks/saved-id"));
    expect(localStorage.getItem("wander:scrapbook-draft")).toBeNull();
  });

  it("asks guests to create an account to download", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Add ⭐ sticker" }));
    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));
    expect(auth.openAuth).toHaveBeenCalledWith(expect.objectContaining({ reason: "Create a free account to download your scrapbook." }));
  });

  it("saves straight away for signed-in users", async () => {
    auth.user = { id: "u1" };
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Add ⭐ sticker" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Show on my profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(api.saveScrapbook).toHaveBeenCalledWith(expect.objectContaining({ isPublic: true })));
    expect(auth.openAuth).not.toHaveBeenCalled();
  });

  it("edits text from the side panel and removes items with Delete", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /Text/ }));
    fireEvent.click(screen.getByRole("button", { name: "+ Add text" }));
    const box = await screen.findByLabelText("Text");
    fireEvent.change(box, { target: { value: "Toronto '26" } });
    expect(screen.getByRole("heading", { name: /Selected: Text “Toronto '26”/ })).toBeTruthy();

    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(window, { key: "Delete" });
    expect(await screen.findByText("0 items")).toBeTruthy();
  });
});
