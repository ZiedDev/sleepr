import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UUID, CurrentSession } from './types';

interface AppState {
    lastSessionID: UUID | null;
    sessionCount: number;
    currentSession: CurrentSession | null;
    setLastSessionID: (id: UUID | null) => void;
    setSessionCount: (count: number) => void;
    setCurrentSession: (session: CurrentSession | null) => void;
}

export const useStorage = create<AppState>()(
    persist(
        (set) => ({
            lastSessionID: null,
            sessionCount: 0,
            currentSession: null,
            setLastSessionID: (id) => set({ lastSessionID: id }),
            setSessionCount: (count) => set({ sessionCount: count }),
            setCurrentSession: (session) => set({ currentSession: session }),
        }),
        {
            name: 'sleep-sun-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);