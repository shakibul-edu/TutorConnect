
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
    const [pendingUpdate, setPendingUpdate] = useState<{
        distance: number;
        locationString: string;
        newLocation: LocationPosition;
    } | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);

    const backendAccess = (session as any)?.backendAccess;

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
        if (!backendAccess) return;
        const syncServerLocation = async () => {
            try {
                const serverLoc = await getLocation(backendAccess);
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
    }, [backendAccess]);

    // 2. Track Position & Update Logic
    useEffect(() => {
        if (!backendAccess) return;
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const geoId = navigator.geolocation.watchPosition(
            async (position) => {
                setPermissionDenied(false); // Reset permission denied if we get a position
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
                            // Build location string as "lat,lon,acc" (PostGIS order requirement with accuracy)
                            const locationString = `${latitude},${longitude},${accuracy.toFixed(2)}`;

                            // First attempt without update param (backend will respond with update_required if needed)
                            const resp = await setLocation(backendAccess, locationString);

                            if (resp?.update_required) {
                                // Instead of window.confirm, set pending update state
                                setPendingUpdate({
                                    distance: resp.distance_km ?? 0,
                                    locationString,
                                    newLocation
                                });
                            } else {
                                // No update_required flag; consider it handled
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
                if (geoError.code === 1) { // PERMISSION_DENIED
                    setPermissionDenied(true);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 10000,
            }
        );

        return () => navigator.geolocation.clearWatch(geoId);
    }, [backendAccess]);

    const confirmUpdate = async () => {
        if (!pendingUpdate || !backendAccess) return;
        try {
            await setLocation(backendAccess, pendingUpdate.locationString, { update: 'true' });
            localStorage.setItem('user_location', JSON.stringify(pendingUpdate.newLocation));
            setPendingUpdate(null);
        } catch (e) {
            console.error("Failed to confirm location update", e);
        }
    };

    const cancelUpdate = () => {
        if (!pendingUpdate) return;
        // User declined; still update baseline locally to avoid repeated prompts for the same location
        localStorage.setItem('user_location', JSON.stringify(pendingUpdate.newLocation));
        setPendingUpdate(null);
    };

    return { 
        location, 
        error, 
        pendingUpdate, 
        permissionDenied,
        confirmUpdate,
        cancelUpdate
    };
};

export default useLocation;
