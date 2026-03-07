// src/hooks/useSettings.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Duration } from 'luxon';

interface SettingsValues {
    // general
    sleepBuffer: Duration;
    wakeBuffer: Duration;
    sleepTarget: Duration | null;
    wakeTarget: Duration | null;
    // statsOrder

    // advanced
    dayStart: Duration;
    blurPerformance: 'lowest' | 'low' | 'balanced' | 'quality';
    //                      2        10         20       infinite
}

const initialState: SettingsValues = {
    sleepBuffer: Duration.fromObject({ minutes: 5 }),
    wakeBuffer: Duration.fromObject({ minutes: 5 }),
    sleepTarget: null,
    wakeTarget: null,
    dayStart: Duration.fromObject({ hours: 22 }),
    blurPerformance: 'balanced',
};

interface SettingsState extends SettingsValues {
    updateSetting: <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => void;
    resetSettings: () => void;
}

const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            ...initialState,
            updateSetting: (key, value) => set((state) => ({ ...state, [key]: value })),
            resetSettings: () => set(initialState),
        }),
        {
            name: 'user-settings',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

export default useSettings;
