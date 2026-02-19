import { Database } from './db.interface'
import { SleepSessionRecord, SunTimesRecord } from './types';
import { openDB, IDBPDatabase, IDBPTransaction, DBSchema } from 'idb'

const DB_NAME = 'sleep-sun-db';
const SLEEP_STORE = 'sleepSessions';
const SUN_STORE = 'sunTimes';
export const STORES = ['sleepSessions', 'sunTimes'] as const;

export interface SleepSunDB extends DBSchema {
  sleepSessions: {
    key: string;
    value: SleepSessionRecord;
    indexes: {
      byEnd: number;
    };
  };

  sunTimes: {
    key: string;
    value: SunTimesRecord & { compositeId: string };
  };
}

let _db_initial: IDBPDatabase<SleepSunDB> | null = null;
let _activeTx: IDBPTransaction<SleepSunDB, typeof STORES, "readwrite"> | null = null;


const _db = new Proxy({} as IDBPDatabase<SleepSunDB>, {
  get(target, prop, receiver) {
    if (!_db_initial) {
      throw new Error("[db.web] Database accessed before initialization. Call initDB() first");
    }
    const value = Reflect.get(_db_initial, prop, receiver);
    return typeof value === 'function' ? value.bind(_db_initial) : value;
  }
});

export const db: Database = {
  async init() {
    _db_initial = await openDB<SleepSunDB>(DB_NAME, 1, {
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

  // Sleep Sessions
  async upsertSleep(record) {
    if (_activeTx) await _activeTx.objectStore(SLEEP_STORE).put(record);
    else await _db.put(SLEEP_STORE, record);
  },

  async getSleep(id) {
    if (_activeTx) return (await _activeTx.objectStore(SLEEP_STORE).get(id)) ?? null;
    return (await _db.get(SLEEP_STORE, id)) ?? null;
  },

  async deleteSleep(id) {
    if (_activeTx) {
      const exists = await _activeTx.objectStore(SLEEP_STORE).get(id);
      if (!exists) return false;
      await _activeTx.objectStore(SLEEP_STORE).delete(id);
    } else {
      const exists = await _db.get(SLEEP_STORE, id);
      if (!exists) return false;
      await _db.delete(SLEEP_STORE, id);
    }
    return true;
  },


  async listSleep(start, end, match) {
    let tx, index;
    if (_activeTx) {
      tx = _activeTx;
      index = tx.objectStore(SLEEP_STORE).index('byEnd');
    } else {
      tx = _db.transaction(SLEEP_STORE, 'readonly');
      index = tx.store.index('byEnd');
    }
    const results: SleepSessionRecord[] = [];
    let cursor = await index.openCursor(IDBKeyRange.lowerBound(start));
    while (cursor) {
      const val = cursor.value;
      const isMatch = match === 'contained' ?
        (val.start >= start && val.end <= end) :
        (val.start <= end);
      if (isMatch) results.push(val);
      cursor = await cursor.continue();
    }
    await tx.done;
    return results;
  },

  async getAllSleep() {
    if (_activeTx) return await _activeTx.objectStore(SLEEP_STORE).getAll();
    return await _db.getAll(SLEEP_STORE);
  },

  // Sun Times

  async upsertSun(r) {
    const compositeId = `${r.date}_${r.lat}_${r.lon}`;
    if (_activeTx) await _activeTx.objectStore(SUN_STORE).put({ ...r, compositeId });
    else await _db.put(SUN_STORE, { ...r, compositeId });
  },

  async getSun(date, lat, lon) {
    const compositeId = `${date}_${lat}_${lon}`;
    if (_activeTx) return (await _activeTx.objectStore(SUN_STORE).get(compositeId)) ?? null;
    return (await _db.get(SUN_STORE, compositeId)) ?? null;
  },

  async listSun(lat, lon, start, end) {
    const all = _activeTx ?
      await _activeTx.objectStore(SUN_STORE).getAll() :
      await _db.getAll(SUN_STORE);
    return all.filter(r => r.lat === lat && r.lon === lon && r.date >= start && r.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async getAllSun() {
    if (_activeTx) return await _activeTx.objectStore(SUN_STORE).getAll();
    return await _db.getAll(SUN_STORE);
  },

  // Transactions / Maintenance

  async runTransaction(action) {
    if (_activeTx) return await action();

    const tx = _db.transaction(STORES, 'readwrite');
    _activeTx = tx;

    try {
      const result = await action();
      await tx.done;
      return result;
    } catch (e) {
      tx.abort();
      throw e;
    } finally {
      _activeTx = null;
    }
  },

  async clearAll() {
    const tx = _db.transaction(STORES, 'readwrite');
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
          reject(new Error("[db.web] No file selected"));
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
