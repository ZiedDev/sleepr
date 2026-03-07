// src/hooks/useSettings.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// settings:
//     - sleep and wake up buffer (Duration)
//     - target sleep and wake up (ClockSlider)
//     - stats order?
//     // advanced
//     - graph day start  (ClockSlider)
//     - blur performance 
//         (lowest, low, balanced, quality)
//         2       10      20      infinite
//     // danger
//     - import (with clear all switch)
//     - export
//     - delete data

interface SettingsValues {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    useMetric: boolean;
}

const initialState: SettingsValues = {
    theme: 'system',
    notifications: true,
    useMetric: true,
};

interface SettingsState extends SettingsValues {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    updateSetting: <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => void;
    resetSettings: () => void;
}

const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            ...initialState,

            setTheme: (theme) => set({ theme }),

            // Generic updater for simple toggles
            updateSetting: (key, value) => set((state) => ({ ...state, [key]: value })),

            // Professional Reset: Returns store to initial constants
            resetSettings: () => set(initialState),
        }),
        {
            name: 'user-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export default useSettings;
