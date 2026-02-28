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
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
            });
            set({ location: loc, errorMsg: null, loading: false });
            useStorage.getState().setLastLocation(loc);

            return loc;
        } catch (e) {
            set({ location: null, errorMsg: 'Failed to fetch location', loading: false });
            console.error("[useLocation] Failed to fetch current location:", e);
            return null;
        }
    },

    fetchOfflineLocation: async () => {
        try {
            const now = Date.now();

            // check local lastLocation (maxAgeShort)
            const stored = useStorage.getState().lastLocation;
            if (stored && now - stored.timestamp <= maxAgeShort) {
                set({ location: stored, errorMsg: null, loading: false });
                return stored;
            }

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
                set({ location: tzLoc, errorMsg: null, loading: false });
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
            set({ location: offsetLoc, errorMsg: null, loading: false });
            return offsetLoc;

        } catch (e) {
            set({ location: null, errorMsg: 'Failed to fetch location', loading: false });
            console.error("[useLocation] Failed to fetch offline location:", e);
            return null;
        }
    },

    initialize: async () => {
        try {
            const now = Date.now();

            // PRE PERMISSION REQUEST
            await get().fetchOfflineLocation();

            // PERMISSION REQUEST
            let currentStatus = (await Location.getForegroundPermissionsAsync()).status;
            if (currentStatus === 'undetermined') {
                currentStatus = (await Location.requestForegroundPermissionsAsync()).status;
            }
            if (currentStatus !== 'granted') {
                // set({ location: null, errorMsg: 'Permission denied', loading: false });
                console.error("[useLocation] Permission denied");
                return;
            }  

            // POST PERMISSION REQUEST

            // await LastKnownPosition (maxAgeLong)
            const knownLoc = await Location.getLastKnownPositionAsync({
                requiredAccuracy: Location.Accuracy.Low,
                maxAge: maxAgeLong,
            })
            console.log('known', knownLoc);
            if (knownLoc) {
                set({ location: knownLoc, errorMsg: null, loading: false });
                useStorage.getState().setLastLocation(knownLoc);
            }

            // fallback to CurrentLocation async
            get().fetchCurrentLocation();
        } catch (e) {
            set({ location: null, errorMsg: 'Failed to fetch location', loading: false });
            console.error("[useLocation] Failed to fetch location:", e);
        }
    },

    refresh: async () => {
        set(state => ({ ...state, loading: true }));
        await get().fetchCurrentLocation();
    },
}));

export default useLocation;