import { useState } from "react";

export type UserCoordinates = {
    lat: number,
    lon: number
};

export function useUserLocation() {
    const [loading, setLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    function getLocation(success: (coordinates: UserCoordinates) => void) {
        setLoading(true);
        setGeoError(null);

        if (!navigator.geolocation) {
            setGeoError("Geolocation is not supported by your browser.");
            setLoading(false);     // geolocation wasn't retrieved, so it doesn't load
            return;
        }

        // Takes two paramaters, 'success': retrieves location, 'geolocationError': unable to get location
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            setLoading(false);
            success({lat, lon});    // coordinates received from user's browser, passed back to function
        },
        (geolocationError) => {
            console.error("Error retrieving geolocation:", geolocationError);
            setGeoError("Unable to retrieve your location right now.");
            setLoading(false);
        });
    }
    return {getLocation, loading, geoError};
}
