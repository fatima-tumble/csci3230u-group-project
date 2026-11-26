import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FilterBar from "./filterBar";

describe("FilterBar", () => {
  it("renders 'All' plus every known category", () => {
    render(<FilterBar selected="All" onSelect={() => {}} />);
    const group = screen.getByRole("group", { name: /filter by category/i });
    for (const label of ["All", "Food", "Events", "Entertainment", "Activities"]) {
      expect(within(group).getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("marks the selected chip as pressed", () => {
    render(<FilterBar selected="Food" onSelect={() => {}} />);
    expect(screen.getByRole("button", { name: "Food" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onSelect with the category when a chip is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar selected="All" onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Entertainment" }));
    expect(onSelect).toHaveBeenCalledWith("Entertainment");
  });

  it("keyboard-activates with Enter", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar selected="All" onSelect={onSelect} />);
    const chip = screen.getByRole("button", { name: "Events" });
    chip.focus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("Events");
  });
});
