import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_NAME = 'sleep-sun.db';

export const db = SQLite.openDatabase(DB_NAME);

export class StoredValue<T> {
    private key: string;
    private value: T | undefined;
    private callback: (self: StoredValue<T>) => void;

    constructor(
        key: string,
        defaultValue: T,
        callback: (self: StoredValue<T>) => void = () => { }
    ) {
        this.key = key;
        this.callback = callback;
        this.value = defaultValue;
        this.load(defaultValue);
    }

    private async load(defaultValue: T) {
        try {
            const raw = await AsyncStorage.getItem(this.key);
            this.value = raw == null ? defaultValue : JSON.parse(raw);
        } catch {
            this.value = defaultValue;
        }
    }

    get val(): T | undefined {
        return this.value;
    }

    set val(v: T | undefined) {
        this.value = v;
        this.update();
    }

    async update() {
        if (this.value === undefined) {
            await AsyncStorage.removeItem(this.key);
        } else {
            await AsyncStorage.setItem(this.key, JSON.stringify(this.value));
        }
        this.callback(this);
    }

    async clear() {
        this.value = undefined;
        await AsyncStorage.removeItem(this.key);
    }
}

export function exec(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                sql,
                params,
                () => resolve(),
                (_, err) => {
                    reject(err);
                    return false;
                }
            );
        });
    });
}

export function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                sql,
                params,
                (_, res) => resolve(res.rows._array as T[]),
                (_, err) => {
                    reject(err);
                    return false;
                }
            );
        });
    });
}

export async function initDB() {
    await exec(`
    CREATE TABLE IF NOT EXISTS sleepSessions (
      id TEXT PRIMARY KEY NOT NULL,
      start INTEGER NOT NULL,
      end INTEGER NOT NULL,
      lat REAL,
      lon REAL,
      createdAt INTEGER,
      updatedAt INTEGER
    );
  `);

    await exec(`
    CREATE TABLE IF NOT EXISTS sunTimes (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      sunrise INTEGER NOT NULL,
      sunset INTEGER NOT NULL,
      updatedAt INTEGER
    );
  `);

    await exec(`CREATE INDEX IF NOT EXISTS idx_sleep_end ON sleepSessions(end);`);
    await exec(`CREATE INDEX IF NOT EXISTS idx_sun_date ON sunTimes(date);`);
}
