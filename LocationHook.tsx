
import { useEffect, useState } from 'react';
import { getLocation, setLocation } from './utils/genralCall';

interface LocationPosition {
    latitude: number;
    longitude: number;
    accuracy: number;
}

const useLocation = (session: any) => {
    const [location, setLocationState] = useState<LocationPosition | null>(null);
    const [error, setError] = useState<string | null>(null);
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

    // 1. Initial Sync: Fetch server location to set baseline
    useEffect(() => {
        if (!idToken) return;
        const syncServerLocation = async () => {
            try {
                const serverLoc = await getLocation(idToken);
                if (serverLoc) {
                    const locData = { 
                        latitude: serverLoc.latitude, 
                        longitude: serverLoc.longitude, 
                        accuracy: serverLoc.accuracy 
                    };
                    localStorage.setItem('user_location', JSON.stringify(locData));
                }
            } catch (err) {
                console.error("Failed to sync initial location", err);
            }
        };
        syncServerLocation();
    }, [idToken]);

    // 2. Track Position & Update Logic
    useEffect(() => {
        if (!idToken) return;
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

                // Retrieve previous location
                const prevLocationStr = localStorage.getItem('user_location');
                
                if (prevLocationStr) {
                    try {
                        const prevLocation = JSON.parse(prevLocationStr);
                        const distance = calculateDistance(
                            prevLocation.latitude, 
                            prevLocation.longitude, 
                            latitude, 
                            longitude
                        );

                        // Threshold check: 0.2km
                        if (distance > 0.2) {
                            // Pause watcher logic or debounce could be handled here if needed, 
                            // but confirm() blocks execution in main thread usually.
                            const shouldUpdate = window.confirm("Your location has changed by more than 0.2km. Do you want to update it on the server?");
                            
                            if (shouldUpdate) {
                                const locationString = `${latitude},${longitude},${accuracy.toFixed(2)}`;
                                await setLocation(idToken, locationString);
                                // Update local baseline to current
                                localStorage.setItem('user_location', JSON.stringify(newLocation));
                            } else {
                                // User denied update. Update local baseline anyway to prevent loop/spamming prompt?
                                // If we don't update local, it will ask again on next movement.
                                // It's better UX to assume "No" means "Don't ask me for this location change".
                                localStorage.setItem('user_location', JSON.stringify(newLocation));
                            }
                        }
                    } catch (e) {
                        // If JSON parse fails, just reset baseline
                        localStorage.setItem('user_location', JSON.stringify(newLocation));
                    }
                } else {
                    // No previous location stored, set current as baseline
                    localStorage.setItem('user_location', JSON.stringify(newLocation));
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
    }, [idToken]);

    return { location, error };
};

export default useLocation;
