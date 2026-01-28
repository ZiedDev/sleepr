import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite'; // or react-native-sqlite-storage
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

const DB_NAME = 'sleep_sun.db';
const db = SQLite.openDatabaseSync(DB_NAME);

export const initDB = async () => {
    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        
        PRAGMA user_version;

        CREATE TABLE IF NOT EXISTS sleepSessions (
            id TEXT PRIMARY KEY NOT NULL,
            start INTEGER NOT NULL,
            "end" INTEGER NOT NULL,
            lat REAL,
            lon REAL,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER
        );

        CREATE TABLE IF NOT EXISTS sunTimes (
            id TEXT PRIMARY KEY NOT NULL,
            date TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            sunrise INTEGER NOT NULL,
            sunset INTEGER NOT NULL,
            updatedAt INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_sleep_end ON sleepSessions("end");
        CREATE INDEX IF NOT EXISTS idx_sun_date ON sunTimes(date);
  `);
};

export const runTransaction = async <T>(
    action: () => Promise<T>
): Promise<T> => {
    await db.execAsync('BEGIN TRANSACTION');
    try {
        const result = await action();
        await db.execAsync('COMMIT');
        return result;
    } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
    }
};

export { db };