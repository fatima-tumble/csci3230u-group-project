import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import RecentlyViewed from "./recentlyViewed";
import { RECENTLY_VIEWED_KEY } from "../data/recentlyViewed";
import { addRecentlyViewedPlace, useRecentlyViewed } from "../hooks/useRecentlyViewed";

// Renders the section wired to the real hook + localStorage, like the home page does
function Harness() {
  const { places, clear } = useRecentlyViewed();
  return <RecentlyViewed places={places} onClear={clear} />;
}

function renderHarness() {
  return render(
    <MemoryRouter>
      <Harness />
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("RecentlyViewed", () => {
  it("renders nothing when there is no history", () => {
    renderHarness();
    expect(screen.queryByRole("heading", { name: "Recently viewed" })).toBeNull();
  });

  it("shows viewed places, newest first, linking to their detail pages", () => {
    addRecentlyViewedPlace({ xid: "W1", name: "CN Tower", categories: ["Activities"] });
    addRecentlyViewedPlace({ xid: "N2", name: "Kensington Market", categories: ["Food"] });
    renderHarness();

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/places/N2", "/places/W1"]);
    expect(links[0].textContent).toContain("Kensington Market");
    expect(links[0].textContent).toContain("Food");
  });

  it("updates when a place is viewed while the page is open", () => {
    renderHarness();
    act(() => addRecentlyViewedPlace({ xid: "W1", name: "CN Tower", categories: [] }));
    expect(screen.getByRole("link", { name: /CN Tower/ })).toBeTruthy();
  });

  it("clears history from the screen and from localStorage", () => {
    addRecentlyViewedPlace({ xid: "W1", name: "CN Tower", categories: ["Activities"] });
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Clear history" }));

    expect(screen.queryByRole("heading", { name: "Recently viewed" })).toBeNull();
    expect(localStorage.getItem(RECENTLY_VIEWED_KEY)).toBeNull();
  });
});
