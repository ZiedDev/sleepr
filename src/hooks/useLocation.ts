import * as Location from 'expo-location';
import { useStorage } from '../db/storage';
import { create } from 'zustand';

interface LocationState {
    location: Location.LocationObject | null;
    errorMsg: string | null;
    loading: boolean;
    initialize: () => Promise<void>;
    fetchCurrentLocation: () => Promise<Location.LocationObject | null>;
    refresh: () => Promise<void>;
}

const maxAge = 172800000; // 2*24*60*60*1000 (ms in 2 days)

const useLocation = create<LocationState>((set, get) => ({
    location: null,
    errorMsg: null,
    loading: true,

    fetchCurrentLocation: async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
            });
            set({ location: loc, errorMsg: null, loading: false });
            useStorage.getState().setLastLocation(loc);

            return loc;
        } catch (e) {
            set({ location: null, errorMsg: 'Failed to fetch location', loading: false });
            return null;
        }
    },

    initialize: async () => {
        try {
            let currentStatus = (await Location.getForegroundPermissionsAsync()).status;
            if (currentStatus === 'undetermined') {
                currentStatus = (await Location.requestForegroundPermissionsAsync()).status;
            }
            if (currentStatus !== 'granted') {
                set({ location: null, errorMsg: 'Permission denied', loading: false });
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
                set({ location: loc, errorMsg: null, loading: false });
                useStorage.getState().setLastLocation(loc);
            }

            await get().fetchCurrentLocation();
        } catch (e) {
            set({ location: null, errorMsg: 'Failed to fetch location', loading: false });
        }
    },

    refresh: async () => {
        set(state => ({ ...state, loading: true }));
        await get().fetchCurrentLocation();
    },
}));

export default useLocation;