// Tests for the Compare Panel feature integrated in Results page
import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ComparePanel from "./comparePanel";
import type { MockPlace } from "../data/places";
import userEvent from "@testing-library/user-event";

function renderComparePanel(selectedPlaces: MockPlace[] = []) {
    return render(
        <ComparePanel selectedPlaces={selectedPlaces} onRemove={() => {}} onToggle={() => {}} />
    );
}

test("shows an empty message when no places are selected", () => {
    renderComparePanel();
    expect(screen.getAllByText(/No places selected yet/i)).toBeTruthy();
    expect(screen.getAllByText("0 / 3")).toBeTruthy();
});

test("shows updated count when one place is selected", () => {
    renderComparePanel([{ xid: "1", name: "CN Tower", description: "", distanceKm: 1.5, categories: ["Activities"], }]);
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByText("CN Tower")).toBeTruthy();
});

test("shows updated count when multiple places are selected", () => {
    renderComparePanel([
        { xid: "1", name: "CN Tower", description: "", distanceKm: 1.5, categories: ["Activities"], },
        { xid: "2", name: "Kensington Market", description: "", distanceKm: 2.2, categories: ["Food"], }
    ]);
    expect(screen.getByText("2 / 3")).toBeTruthy();
    expect(screen.getByText("CN Tower")).toBeTruthy();
    expect(screen.getByText("Kensington Market")).toBeTruthy();
});

test("ask user to select another place to begin comparison (when 1 place is selected)", () => {
    renderComparePanel([{ xid: "1", name: "CN Tower", description: "", distanceKm: 1.5, categories: ["Activities"], }]);
    expect(screen.getByText("Please select at least one more place for comparison.")).toBeTruthy();
});

test("onRemove is called when a place is removed", async() => {
    let removedPlace = "";
    render(
        <ComparePanel selectedPlaces={[{ xid: "1", name: "CN Tower", description: "", distanceKm: 1.5, categories: ["Activities"],}]} 
        onRemove={(id) => {removedPlace = id;}} 
        onToggle={() => {}} />
    );
    await userEvent.click(screen.getByRole("button", {name: "Remove CN Tower from comparison",}));
    expect(removedPlace).toBeTruthy();
});

test("onToggle is called when close button is clicked", async() => {
    let buttonToggled = false;
    render(
        <ComparePanel selectedPlaces={[]} onRemove={() => {}} onToggle={() => { buttonToggled = true;}} />
    );
    await userEvent.click(screen.getByRole("button", {name: "Close",}));
    expect(buttonToggled).toBeTruthy();
});
