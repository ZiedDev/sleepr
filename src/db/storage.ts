import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UUID, CurrentSession } from './types';
import { LocationObject } from 'expo-location';

interface AppState {
    lastSessionID: UUID | null;
    sessionCount: number;
    currentSession: CurrentSession | null;
    lastLocation: LocationObject | null;
    setLastSessionID: (id: UUID | null) => void;
    setSessionCount: (count: number) => void;
    setCurrentSession: (session: CurrentSession | null) => void;
    setLastLocation: (location: LocationObject | null) => void;
}

export const useStorage = create<AppState>()(
    persist(
        (set) => ({
            lastSessionID: null,
            sessionCount: 0,
            currentSession: null,
            lastLocation: null,
            setLastSessionID: (id) => set({ lastSessionID: id }),
            setSessionCount: (count) => set({ sessionCount: count }),
            setCurrentSession: (session) => set({ currentSession: session }),
            setLastLocation: (location) => set({ lastLocation: location }),
        }),
        {
            name: 'sleep-sun-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);