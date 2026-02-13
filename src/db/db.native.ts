import { Database } from './db.interface'
import { SleepSessionRecord, SunTimesRecord } from './types';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite'; // or react-native-sqlite-storage
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

const DB_NAME = 'sleep_sun.db';

let _db_initial: SQLite.SQLiteDatabase | null = null;

const _db = new Proxy({} as SQLite.SQLiteDatabase, {
  get(target, prop, receiver) {
    if (!_db_initial) {
      throw new Error(`Attempted to access DB before calling db.init()`);
    }
    const value = Reflect.get(_db_initial, prop, receiver);
    return typeof value === 'function' ? value.bind(_db_initial) : value;
  }
});

export const db: Database = {
  async init() {
    _db_initial = await SQLite.openDatabaseAsync(DB_NAME);
    await _db.execAsync(`
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
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            date TEXT NOT NULL,
            sunrise INTEGER NOT NULL,
            sunset INTEGER NOT NULL,
            updatedAt INTEGER,
            PRIMARY KEY (lat, lon, date)
        );

        CREATE INDEX IF NOT EXISTS idx_sleep_end_start ON sleepSessions("end", start);
  `);
  },

  async upsertSleep(r) {
    await _db.runAsync(
      `INSERT OR REPLACE INTO sleepSessions 
      (id, start, "end", lat, lon, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [r.id, r.start, r.end, r.lat, r.lon, r.createdAt, r.updatedAt ?? null]
    );
  },

  async getSleep(id) {
    return await _db.getFirstAsync<SleepSessionRecord>(
      `SELECT * FROM sleepSessions WHERE id = ?`,
      [id]
    );
  },
  async deleteSleep(id) {
    const res = await _db.runAsync(
      `DELETE FROM sleepSessions WHERE id = ?`,
      [id]
    );
    return res.changes > 0;
  },

  async listSleep(start, end, match) {
    const where = match === 'contained' ?
      `start >= ? AND "end" <= ?` :
      `"end" >= ? AND start <= ?`;
    return await _db.getAllAsync<SleepSessionRecord>(
      `SELECT * FROM sleepSessions WHERE ${where} ORDER BY "end" ASC`,
      [start, end]
    );
  },

  async getAllSleep() {
    return await _db.getAllAsync<SleepSessionRecord>(
      `SELECT * FROM sleepSessions`
    );
  },

  async upsertSun(r) {
    await _db.runAsync(
      `INSERT OR REPLACE INTO sunTimes 
      (date, lat, lon, sunrise, sunset, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [r.date, r.lat, r.lon, r.sunrise, r.sunset, r.updatedAt ?? null]
    );
  },

  async getSun(date, lat, lon) {
    return await _db.getFirstAsync<SunTimesRecord>(
      `SELECT * FROM sunTimes WHERE date = ? AND lat = ? AND lon = ?`,
      [date, lat, lon]
    );
  },

  async listSun(lat, lon, start, end) {
    return await _db.getAllAsync<SunTimesRecord>(
      `SELECT * FROM sunTimes 
      WHERE lat = ? AND lon = ? AND date BETWEEN ? AND ? 
      ORDER BY date ASC`,
      [lat, lon, start, end]
    );
  },

  async getAllSun() {
    return await _db.getAllAsync<SunTimesRecord>(
      `SELECT * FROM sunTimes`
    );
  },

  async runTransaction(action) {
    await _db.execAsync('BEGIN TRANSACTION');
    try {
      const res = await action();
      await _db.execAsync('COMMIT');
      return res;
    } catch (e) {
      await _db.execAsync('ROLLBACK');
      throw e;
    }
  },

  async clearAll() {
    await _db.execAsync(
      `DELETE FROM sleepSessions; 
      DELETE FROM sunTimes;`
    );
  },

  async importJSON(): Promise<object> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: 'application/json',
      });
      if (result.canceled) {
        throw new Error('User cancelled import');
      }
      const { uri } = result.assets[0];

      const jsonString = await fetch(uri).then(res => res.text());
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Import Error:", error);
      throw error;
    }
  },

  async exportJSON(
    data: object,
    filename: string
  ): Promise<void> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const tempUri = FileSystem.cacheDirectory + `${filename}.json`;

      await FileSystem.writeAsStringAsync(
        tempUri,
        jsonString,
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          throw new Error("User cancelled folder picker");
        } else {
          const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            `${filename}.json`,
            'application/json'
          );

          await FileSystem.writeAsStringAsync(
            fileUri,
            jsonString,
            { encoding: FileSystem.EncodingType.UTF8 }
          );
        }
      }

      await Sharing.shareAsync(tempUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export JSON Data',
        UTI: 'public.json',
      });

    } catch (error) {
      console.error("Export Error:", error);
      throw error;
    }
  },
}
