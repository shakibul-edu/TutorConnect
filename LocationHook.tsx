
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
    // locationError is true whenever any geolocation failure occurs (including permission denied)
    const [locationError, setLocationError] = useState(false);

    const backendAccess = (session as any)?.backendAccess;
    const isBanned = (session as any)?.banned_error || (session as any)?.banned;

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

    const retryLocation = async () => {
        if (!backendAccess) return Promise.reject(new Error("No backend access"));

        return new Promise<void>((resolve, reject) => {
            if (!navigator.geolocation) {
                const err = new Error('Geolocation is not supported by your browser');
                setError(err.message);
                reject(err);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const newLocation = { latitude, longitude, accuracy };
                    const locationString = `${latitude},${longitude},${accuracy.toFixed(2)}`;
                    
                    try {
                        // We attempt to send to server. It may respond but we update it manually anyway
                        await setLocation(backendAccess, locationString, { update: 'true' });
                        localStorage.setItem('user_location', JSON.stringify(newLocation));
                        setLocationState(newLocation);
                        setPermissionDenied(false);
                        setLocationError(false);
                        window.location.reload();
                        resolve();
                    } catch (e) {
                        console.error("Failed to update location explicitly", e);
                        setLocationError(true);
                        reject(e);
                    }
                },
                (err) => {
                    // Handle denied permissions or other GPS errors
                    if (err.code === 1) { // PERMISSION_DENIED
                        setPermissionDenied(true);
                    } else {
                        console.warn("Geolocation warning:", err.message);
                    }
                    setLocationError(true);
                    reject(err);
                },
                { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
            );
        });
    };

    // 1. Initial Sync: Fetch server location to set baseline
    useEffect(() => {
        if (!backendAccess || isBanned) {
            console.warn('⏭️ Skipping location sync - backendAccess:', !!backendAccess, 'isBanned:', isBanned);
            return;
        }
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
            } catch (err: any) {
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

        let geoId: number | null = null;

        const startTracking = () => {
            if (geoId !== null) return; // Already tracking
            geoId = navigator.geolocation.watchPosition(
            async (position) => {
                setPermissionDenied(false); // Reset permission denied if we get a position
                setLocationError(false);   // Reset any location error on successful position
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
                setLocationError(true);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 10000,
            }
        );
        };

        // Check permissions before tracking to avoid unwanted browser prompts
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'granted') {
                    startTracking();
                }
                
                // If permission changes to granted, start tracking
                result.addEventListener('change', () => {
                    if (result.state === 'granted') {
                        startTracking();
                    }
                });
            }).catch(e => {
                // Fallback if permissions API fails but geolocation is available
                // We won't auto-start to avoid prompts, rely on retryLocation
                console.warn("Permissions API error", e);
            });
        }

        return () => {
            if (geoId !== null) {
                navigator.geolocation.clearWatch(geoId);
            }
        };
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
        locationError,
        confirmUpdate,
        cancelUpdate,
        retryLocation
    };
};

export default useLocation;
