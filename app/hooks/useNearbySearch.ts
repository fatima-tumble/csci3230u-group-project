import { createSearchParams, useNavigate } from "react-router";
import { useUserLocation } from "./useUserLocation";

export function useNearbySearch() {
    const navigate = useNavigate();
    const { getLocation, loading, geoError } = useUserLocation();

    function searchNearby() {
        getLocation((coordinates) => {
            const search = createSearchParams();

            search.set("nearby", "current");

            // navigates to results page depending on user location
            navigate(
                {
                    pathname: "/results",
                    search: search.toString(),
                },
                {
                    state: {coordinates},
                },
            );
        });
    }
    return { searchNearby, loading, geoError };
}
