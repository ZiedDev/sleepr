import { DateTime, Duration } from 'luxon';
import { StoredValue, exec, query, initDB } from './storage';
import {
  SleepSessionRecord,
  SunTimesRecord,
  CurrentSession
} from './types';

/* ------------------------------- constants ------------------------------- */

const CONCURRENCY_LIMIT = 5;
const CONCURRENCY_DELAY_MS = 50;
const DS = 86400;

/* ------------------------------- utilities ------------------------------- */

function uuid(): string {
  return global.crypto?.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

function toEpochSec(input: any): number | null {
  if (input == null) return null;

  if (typeof input === 'number') {
    return Math.floor(Math.abs(input) < 1e11 ? input : input / 1000);
  }

  if (DateTime.isDateTime(input) && input.isValid) {
    return Math.floor(input.toSeconds());
  }

  if (input instanceof Date) {
    return Math.floor(input.getTime() / 1000);
  }

  const iso = DateTime.fromISO(input);
  if (iso.isValid) return Math.floor(iso.toSeconds());

  return null;
}

function toISODate(input: any): string | null {
  const sec = toEpochSec(input);
  if (sec == null) return null;
  return DateTime.fromSeconds(sec).toISODate();
}

function roundLatLon(v: any): number | null {
  if (v == null || isNaN(v)) return null;
  return Number(Number(v).toFixed(2));
}

/* -------------------------------- Logic -------------------------------- */

class Logic {
  lastSessionID = new StoredValue<string | null>('lastSessionID', null);
  sessionCount = new StoredValue<number>('sessionCount', 0);
  currentSession = new StoredValue<CurrentSession | null>('currentSession', null);

  constructor() {
    initDB();
  }

  /* ============================= sleepSession ============================= */

  sleepSession = {
    create: async ({
      start,
      end,
      lat = null,
      lon = null,
      id = null
    }: any): Promise<SleepSessionRecord> => {
      start = toEpochSec(start);
      end = toEpochSec(end);
      if (start == null || end == null) throw new Error('start and end required');

      const record: SleepSessionRecord = {
        id: id ?? uuid(),
        start,
        end,
        lat: roundLatLon(lat),
        lon: roundLatLon(lon),
        createdAt: toEpochSec(DateTime.now())!
      };

      await exec(
        `INSERT INTO sleepSessions (id,start,end,lat,lon,createdAt)
         VALUES (?,?,?,?,?,?)`,
        Object.values(record)
      );

      this.sessionCount.val = (this.sessionCount.val ?? 0) + 1;
      this.lastSessionID.val = record.id;

      return record;
    },

    get: async (id: string) => {
      if (!id) throw new Error('id required');
      const rows = await query<SleepSessionRecord>(
        `SELECT * FROM sleepSessions WHERE id = ?`,
        [id]
      );
      return rows[0];
    },

    update: async ({
      id,
      start = null,
      end = null,
      lat = null,
      lon = null
    }: any): Promise<SleepSessionRecord> => {
      if (!id) throw new Error('id required');

      const rows = await query<SleepSessionRecord>(
        `SELECT * FROM sleepSessions WHERE id = ?`,
        [id]
      );
      const existing = rows[0];
      if (!existing) throw new Error('record not found');

      const updated: SleepSessionRecord = {
        ...existing,
        start: toEpochSec(start) ?? existing.start,
        end: toEpochSec(end) ?? existing.end,
        lat: roundLatLon(lat) ?? existing.lat,
        lon: roundLatLon(lon) ?? existing.lon,
        updatedAt: toEpochSec(DateTime.now())!
      };

      await exec(
        `UPDATE sleepSessions
         SET start=?, end=?, lat=?, lon=?, updatedAt=?
         WHERE id=?`,
        [
          updated.start,
          updated.end,
          updated.lat,
          updated.lon,
          updated.updatedAt,
          id
        ]
      );

      return updated;
    },

    delete: async (id: string) => {
      if (!id) throw new Error('id required');

      await exec(`DELETE FROM sleepSessions WHERE id = ?`, [id]);

      this.sessionCount.val = Math.max((this.sessionCount.val ?? 1) - 1, 0);
      if (this.lastSessionID.val === id) this.lastSessionID.val = null;

      return true;
    },

    start: ({ lat = null, lon = null }: any = {}) => {
      this.currentSession.val = {
        start: DateTime.now().toISO(),
        lat,
        lon
      };
    },

    stop: async ({ lat = null, lon = null }: any = {}) => {
      const session = this.currentSession.val;
      if (!session) throw new Error('no current session started');

      session.end = DateTime.now().toISO();
      session.lat = lat ?? session.lat;
      session.lon = lon ?? session.lon;

      if (session.end < session.start) {
        throw new Error('end cannot be before start');
      }

      const record = await this.sleepSession.create(session);
      this.currentSession.val = null;

      return record;
    },

    list: async ({ rangeStart, rangeEnd }: any) => {
      rangeStart = toEpochSec(rangeStart);
      rangeEnd = toEpochSec(rangeEnd);

      if (rangeStart == null || rangeEnd == null) {
        throw new Error('rangeStart and rangeEnd required');
      }
      if (rangeEnd < rangeStart) {
        throw new Error('end cannot be before start');
      }

      return query<SleepSessionRecord>(
        `SELECT * FROM sleepSessions
         WHERE end >= ? AND start <= ?
         ORDER BY end ASC`,
        [rangeStart, rangeEnd]
      );
    }
  };

  /* =============================== sunTimes =============================== */

  sunTimes = {
    _makeId: ({ date, lat, lon }: any) => {
      if (!toISODate(date)) throw new Error('date required');
      if (roundLatLon(lat) == null || roundLatLon(lon) == null) {
        throw new Error('lat and lon required');
      }
      return `${toISODate(date)}_${roundLatLon(lat)}_${roundLatLon(lon)}`;
    },

    put: async ({
      date,
      lat,
      lon,
      sunrise,
      sunset
    }: any): Promise<SunTimesRecord> => {
      sunrise = toEpochSec(sunrise);
      sunset = toEpochSec(sunset);
      if (sunrise == null || sunset == null) {
        throw new Error('sunrise and sunset required');
      }

      const id = this.sunTimes._makeId({ date, lat, lon });
      const record: SunTimesRecord = {
        id,
        date: id.split('_')[0],
        lat: roundLatLon(lat)!,
        lon: roundLatLon(lon)!,
        sunrise,
        sunset,
        updatedAt: toEpochSec(DateTime.now())!
      };

      await exec(
        `INSERT OR REPLACE INTO sunTimes
         (id,date,lat,lon,sunrise,sunset,updatedAt)
         VALUES (?,?,?,?,?,?,?)`,
        Object.values(record)
      );

      return record;
    },

    get: async ({ date, lat, lon }: any) => {
      const id = this.sunTimes._makeId({ date, lat, lon });
      const rows = await query<SunTimesRecord>(
        `SELECT * FROM sunTimes WHERE id = ?`,
        [id]
      );
      return rows[0];
    },

    list: async ({
      rangeStart,
      rangeEnd,
      lat = null,
      lon = null
    }: any) => {
      rangeStart = toEpochSec(rangeStart);
      rangeEnd = toEpochSec(rangeEnd);
      lat = roundLatLon(lat);
      lon = roundLatLon(lon);

      if (rangeStart == null || rangeEnd == null) {
        throw new Error('rangeStart and rangeEnd required');
      }

      const startDate = toISODate(rangeStart)!;
      const endDate = toISODate(rangeEnd)!;

      const rows = await query<SunTimesRecord>(
        `SELECT * FROM sunTimes
         WHERE date BETWEEN ? AND ?`,
        [startDate, endDate]
      );

      return rows.filter(r =>
        (lat == null || r.lat === lat) &&
        (lon == null || r.lon === lon)
      );
    },

    request: async ({ date, lat, lon }: any) => {
      const cached = await this.sunTimes.get({ date, lat, lon });
      if (cached) return cached;

      const url =
        `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}` +
        `&date=${toISODate(date)}&formatted=0`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`sunrise-sunset error ${res.status}`);
      const data = await res.json();
      if (data.status !== 'OK') throw new Error(data.status);

      return this.sunTimes.put({
        date,
        lat,
        lon,
        sunrise: data.results.sunrise,
        sunset: data.results.sunset
      });
    },

    _runConcurrent: async (
      tasks: (() => Promise<any>)[],
      limit = CONCURRENCY_LIMIT,
      delay = CONCURRENCY_DELAY_MS
    ) => {
      const results: Promise<any>[] = [];
      const executing = new Set<Promise<any>>();

      for (const task of tasks) {
        const p = task().then(r => {
          executing.delete(p);
          return r;
        });

        results.push(p);
        executing.add(p);

        if (executing.size >= limit) await Promise.race(executing);
        if (delay > 0) await new Promise(r => setTimeout(r, delay));
      }

      return Promise.all(results);
    },

    requestList: async ({ rangeStart, rangeEnd, lat, lon }: any) => {
      if (roundLatLon(lat) == null || roundLatLon(lon) == null) {
        throw new Error('lat and lon required');
      }

      const cached = await this.sunTimes.list({ rangeStart, rangeEnd, lat, lon });
      const cachedMap = new Map(cached.map(r => [r.date, r]));

      rangeStart = toEpochSec(rangeStart)!;
      rangeEnd = toEpochSec(rangeEnd)!;

      const tasks: (() => Promise<SunTimesRecord>)[] = [];
      const results: SunTimesRecord[] = [];

      let currDay = DateTime.fromSeconds(rangeStart).startOf('day');
      const endDay = DateTime.fromSeconds(rangeEnd).endOf('day');

      while (currDay <= endDay) {
        const date = toISODate(currDay)!;
        if (cachedMap.has(date)) {
          results.push(cachedMap.get(date)!);
        } else {
          tasks.push(() => this.sunTimes.request({ date, lat, lon }));
        }
        currDay = currDay.plus({ days: 1 });
      }

      const fetched = await this.sunTimes._runConcurrent(tasks);
      return [...results, ...fetched].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    }
  };

  /* ============================== statistics ============================== */

  statistics = {
    async getGraph(input: any, maxHeight = 100) {
      let records: SleepSessionRecord[];
      let rangeStart: number;
      let rangeEnd: number;

      if (Array.isArray(input)) {
        records = input;
        const ends = records.map(r => r.end);
        rangeStart = Math.min(...ends);
        rangeEnd = Math.max(...ends);
      } else {
        records = await this.sleepSession.list(input);
        rangeStart = toEpochSec(input.rangeStart)!;
        rangeEnd = toEpochSec(input.rangeEnd)!;
      }

      const map: Record<string, number> = {};
      let d = DateTime.fromSeconds(rangeStart).startOf('day');
      const end = DateTime.fromSeconds(rangeEnd).endOf('day');

      while (d <= end) {
        map[toISODate(d)!] = 0;
        d = d.plus({ days: 1 });
      }

      records.forEach(r => {
        map[toISODate(r.end)!] += r.end - r.start;
      });

      const max = Math.max(...Object.values(map));

      const out: any = {};
      for (const [k, v] of Object.entries(map)) {
        out[k] = {
          durationSeconds: v,
          durationTime: Duration.fromMillis(v * 1000).toFormat('hh:mm:ss'),
          height: max === 0 ? 0 : (v / max) * maxHeight
        };
      }

      return out;
    }
  };
}

/* -------------------------------- singleton -------------------------------- */

export const logic = new Logic();
