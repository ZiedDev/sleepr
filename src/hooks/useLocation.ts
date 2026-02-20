import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useStorage } from '../db/storage';

interface LocationState {
    location: Location.LocationObject | null;
    errorMsg: string | null;
    loading: boolean;
}

const maxAge = 172800000; // 2*24*60*60*1000 (ms in 2 days)

export const useLocation = () => {
    const [state, setState] = useState<LocationState>({
        location: null,
        errorMsg: null,
        loading: true,
    });

    const fetchCurrentLocation = useCallback(async (): Promise<Location.LocationObject | null> => {
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
                // mayShowUserSettingsDialog: false
            });

            setState({ location: loc, errorMsg: null, loading: false });
            useStorage.getState().setLastLocation(loc);
            return loc;
        } catch (e) {
            setState({ location: null, errorMsg: 'Failed to fetch location', loading: false });
            return null;
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setState({ location: null, errorMsg: 'Permission denied', loading: false });
                    return;
                }

                let loc = await Location.getLastKnownPositionAsync({
                    requiredAccuracy: Location.Accuracy.Low,
                    maxAge
                })

                if (!loc) {
                    const stored = useStorage.getState().lastLocation;
                    if (stored && Date.now() - stored.timestamp <= maxAge) loc = stored;
                }

                if (loc) {
                    setState({ location: loc, errorMsg: null, loading: false });
                    useStorage.getState().setLastLocation(loc);
                }

                fetchCurrentLocation();
            } catch (e) {
                setState({ location: null, errorMsg: 'Failed to fetch location', loading: false });
            }
        })();
    }, [fetchCurrentLocation]);

    const refresh = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true }));
        await fetchCurrentLocation();
    }, [fetchCurrentLocation]);

    return { ...state, refresh };
};