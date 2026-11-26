import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "./searchBar";

describe("SearchBar", () => {
  it("renders the controlled value", () => {
    render(<SearchBar value="cafe" onChange={() => {}} />);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("cafe");
  });

  it("uses the default label when none is given", () => {
    render(<SearchBar value="" onChange={() => {}} />);
    expect(screen.getByLabelText("Search places")).toBeTruthy();
  });

  it("uses a custom label when provided", () => {
    render(<SearchBar value="" onChange={() => {}} label="Filter results" />);
    expect(screen.getByLabelText("Filter results")).toBeTruthy();
  });

  it("uses a custom placeholder when provided", () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="type a name" />);
    expect(screen.getByPlaceholderText("type a name")).toBeTruthy();
  });

  it("calls onChange with each keystroke", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "abc");
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith("c");
  });
});
