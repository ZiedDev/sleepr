import { Database } from './db.interface'
import { SleepSessionRecord, SunTimesRecord } from './types';
import { openDB, IDBPDatabase } from 'idb'

const DB_NAME = 'sleep-sun-db';
const SLEEP_STORE = 'sleepSessions';
const SUN_STORE = 'sunTimes';

let _db_initial: IDBPDatabase | null = null;

const _db = new Proxy({} as IDBPDatabase, {
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
    _db_initial = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SLEEP_STORE)) {
          const s = db.createObjectStore(SLEEP_STORE, { keyPath: 'id' });
          s.createIndex('byEnd', 'end');
        }
        if (!db.objectStoreNames.contains(SUN_STORE)) {
          db.createObjectStore(SUN_STORE, { keyPath: 'compositeId' });
        }
      }
    });
  },

  async upsertSleep(record) { await _db.put(SLEEP_STORE, record); },

  async getSleep(id) { return (await _db.get(SLEEP_STORE, id)) || null; },

  async deleteSleep(id) {
    const exists = await _db.get(SLEEP_STORE, id);
    if (!exists) return false;
    await _db.delete(SLEEP_STORE, id);
    return true;
  },

  async listSleep(start, end, match) {
    const tx = _db.transaction(SLEEP_STORE, 'readonly');
    const index = tx.store.index('byEnd');
    const results: SleepSessionRecord[] = [];
    let cursor = await index.openCursor(IDBKeyRange.lowerBound(start));
    while (cursor) {
      const val = cursor.value;
      const isMatch = match === 'contained' ? (val.start >= start && val.end <= end) : (val.start <= end);
      if (isMatch) results.push(val);
      cursor = await cursor.continue();
    }
    return results;
  },

  async getAllSleep() { return await _db.getAll(SLEEP_STORE); },

  async upsertSun(r) {
    const compositeId = `${r.date}_${r.lat}_${r.lon}`;
    await _db.put(SUN_STORE, { ...r, compositeId });
  },

  async getSun(date, lat, lon) {
    return (await _db.get(SUN_STORE, `${date}_${lat}_${lon}`)) || null;
  },

  async listSun(lat, lon, start, end) {
    const all = await _db.getAll(SUN_STORE);
    return all.filter(r => r.lat === lat && r.lon === lon && r.date >= start && r.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async getAllSun() { return await _db.getAll(SUN_STORE); },

  async runTransaction(action) { return await action(); },

  async clearAll() {
    const tx = _db.transaction([SLEEP_STORE, SUN_STORE], 'readwrite');
    await tx.objectStore(SLEEP_STORE).clear();
    await tx.objectStore(SUN_STORE).clear();
    await tx.done;
  },
  
  async importJSON(): Promise<object> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const text = await file.text();
          const json = JSON.parse(text);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };

      input.click();
    });
  },

  async exportJSON(
    data: object,
    filename: string
  ): Promise<void> {
    const blob = new Blob([JSON.stringify(data, null, 4)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json')
      ? filename
      : `${filename}.json`;

    a.click();
    URL.revokeObjectURL(url);
  },
}
