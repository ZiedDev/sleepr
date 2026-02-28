import * as Location from 'expo-location';
import cityTimezones from 'city-timezones';
import { DateTime } from 'luxon';
import { useStorage } from '../db/storage';
import { create } from 'zustand';

interface LocationState {
    location: Location.LocationObject | null;
    errorMsg: string | null;
    loading: boolean;
    initialize: () => Promise<void>;
    fetchCurrentLocation: () => Promise<Location.LocationObject | null>;
    fetchOfflineLocation: () => Promise<Location.LocationObject | null>;
    refresh: () => Promise<void>;
}

const maxAgeLong = 172800000; // 2*24*60*60*1000 (ms in 2 days)
const maxAgeShort = 7200000; // 2*60*60*1000 (ms in 2 hours)

const useLocation = create<LocationState>((set, get) => ({
    location: null,
    errorMsg: null,
    loading: true,

    fetchCurrentLocation: async () => {
        try {
            return await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low
            });
        } catch (e) {
            console.error("[useLocation] Failed to fetch current location:", e);
            return null;
        }
    },

    fetchOfflineLocation: async () => {
        try {
            const now = Date.now();

            // check local lastLocation (maxAgeShort)
            const stored = useStorage.getState().lastLocation;
            if (stored && now - stored.timestamp <= maxAgeShort) return stored;

            // fallback to timezone
            const zoneName = DateTime.now().zoneName;
            const cityName = zoneName.split('/').pop()?.replace(/_/g, ' ') || '';
            const cityLookup = cityTimezones.lookupViaCity(cityName);
            if (cityLookup && cityLookup.length > 0) {
                const { lat, lng } = cityLookup[0];
                const tzLoc: Location.LocationObject = {
                    coords: {
                        latitude: lat,
                        longitude: lng,

                        accuracy: null,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                    },
                    timestamp: now,
                };
                return tzLoc;
            }

            // fallback to UTC Offset
            const offsetLoc: Location.LocationObject = {
                coords: {
                    latitude: 0,
                    longitude: (DateTime.local().offset / 4),

                    accuracy: null,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                },
                timestamp: now,
            };
            return offsetLoc;

        } catch (e) {
            console.error("[useLocation] Failed to fetch offline location:", e);
            return null;
        }
    },

    initialize: async () => {
        try {
            // PRE PERMISSION REQUEST
            const offlineLoc = await get().fetchOfflineLocation();
            if (offlineLoc) set({ location: offlineLoc, errorMsg: null, loading: false });

            // PERMISSION REQUEST
            let currentStatus = (await Location.getForegroundPermissionsAsync()).status;
            if (currentStatus === 'undetermined')
                currentStatus = (await Location.requestForegroundPermissionsAsync()).status;
            if (currentStatus !== 'granted') {
                console.error("[useLocation] Permission denied");
                return;
            }

            // POST PERMISSION REQUEST

            const updateLocationState = (loc: Location.LocationObject) => {
                set({ location: loc, errorMsg: null, loading: false });
                useStorage.getState().setLastLocation(loc);
            };

            // await LastKnownPosition (maxAgeLong)
            const knownLoc = await Location.getLastKnownPositionAsync({
                requiredAccuracy: Location.Accuracy.Low,
                maxAge: maxAgeLong,
            })
            if (knownLoc) updateLocationState(knownLoc);

            // fallback to CurrentLocation async
            get().fetchCurrentLocation().then(loc => loc && updateLocationState(loc));
        } catch (e) {
            set({ location: null, errorMsg: 'Failed to fetch location', loading: false });
            console.error("[useLocation] Failed to fetch location:", e);
        }
    },

    refresh: async () => {
        set({ loading: true });
        const currentLoc = await get().fetchCurrentLocation();
        if (currentLoc) {
            set({ location: currentLoc, errorMsg: null, loading: false });
            useStorage.getState().setLastLocation(currentLoc);
        } else {
            set({ errorMsg: 'Failed to refresh', loading: false });
        }
    },
}));

export default useLocation;