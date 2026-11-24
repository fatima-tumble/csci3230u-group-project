import { useState } from "react";
import type { MockPlace } from "~/data/places";

export default function usePlaceComparison(places: MockPlace[]) {
    const [selectedPlaces, setSelectedPlaces] = useState<MockPlace[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const selectedIds = selectedPlaces.map((place) => place.xid);

    function toggleComparePlace(placeId:string) {
        setSelectedPlaces((currentPlaces) => {
            const alreadySelected = currentPlaces.some((place) => place.xid === placeId);

            if (alreadySelected) { return currentPlaces.filter((place) => place.xid !== placeId); }
            if (currentPlaces.length >= 3) { return currentPlaces; }

            const placeToAdd = places.find((place) => place.xid === placeId);    //finds the info from the results page's cards (finds the place object via its ID)
            if (!placeToAdd) { return currentPlaces; }

            return [...currentPlaces, placeToAdd];
        });
    }

    function removeComparePlace(placeId: string) {
        setSelectedPlaces((currentPlaces) => currentPlaces.filter((place) => place.xid !== placeId));
    }

    return { selectedIds, selectedPlaces, isPanelOpen, setIsPanelOpen, toggleComparePlace, removeComparePlace };
}