import { useEffect, useState, useRef } from 'react';
import { getLocation, setLocation } from './utils/genralCall';

interface LocationPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
}

const useLocation = (session: any) => {
    const [location, setLocationState] = useState<LocationPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [initialFetchDone, setInitialFetchDone] = useState(false);
    const backendLocationRef = useRef<LocationPosition | null>(null);
    const idToken = session?.id_token;

    // Helper to calculate distance in KM
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    // 1. Initial Sync: Fetch server location
    useEffect(() => {
        if (!idToken) {
             setInitialFetchDone(true);
             return;
        }
        const fetchBackendLocation = async () => {
            try {
                const serverLoc = await getLocation(idToken);
                if (serverLoc) {
                    backendLocationRef.current = {
                        latitude: serverLoc.latitude, 
                        longitude: serverLoc.longitude, 
                        accuracy: serverLoc.accuracy 
                    };
                }
            } catch (err) {
                console.error("Failed to fetch backend location", err);
            } finally {
                setInitialFetchDone(true);
            }
        };
        fetchBackendLocation();
    }, [idToken]);

    // 2. Track Position & Update Logic
    useEffect(() => {
        if (!idToken || !initialFetchDone) return;
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const geoId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const newLocation = { latitude, longitude, accuracy };
                
                // Update state for UI
                setLocationState(newLocation);

                const backendLoc = backendLocationRef.current;
                
                let shouldPrompt = false;

                if (!backendLoc) {
                    // No backend location found, prompt to set it
                    shouldPrompt = true;
                } else {
                     const distance = calculateDistance(
                        backendLoc.latitude,
                        backendLoc.longitude,
                        latitude,
                        longitude
                    );
                    if (distance > 0.2) {
                        shouldPrompt = true;
                    }
                }

                if (shouldPrompt) {
                     const userConfirmed = window.confirm("Your location has changed by more than 0.2km. Do you want to update it on the server?");

                     if (userConfirmed) {
                         try {
                            const locationString = `${latitude},${longitude},${accuracy.toFixed(2)}`;
                            await setLocation(idToken, locationString);

                            localStorage.setItem('user_location', JSON.stringify(newLocation));

                            backendLocationRef.current = newLocation;
                         } catch (e) {
                             console.error("Failed to update location", e);
                         }
                     } else {
                         // User denied. Update backend reference LOCALLY to suppress further prompts for this location.
                         backendLocationRef.current = newLocation;
                     }
                }
            },
            (geoError) => {
                setError(geoError.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 10000,
            }
        );

        return () => navigator.geolocation.clearWatch(geoId);
    }, [idToken, initialFetchDone]);

    return { location, error };
};

export default useLocation;
