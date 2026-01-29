import { DateTime, Duration } from 'luxon';
import { db, useStorage, runTransaction } from './storage';
import {
  UUID, Timestamp, EpochSec, ISODate, Coordinate, SleepSessionRecord, SunTimesRecord, CurrentSession, TimeMeanResult, AveragesResult, GraphDataPoint, GraphResults, IntervalTimeline, SplitInterval, ExportData
} from './types';

// -------------------- Utilities & Consts --------------------

const CONCURRENCY_LIMIT = 5;
const CONCURRENCY_DELAY_MS = 50;
const DS = 86400; // 60*60*24

export const rangeLerp = (
  v: number,
  iStart: number, iEnd: number,
  oStart: number, oEnd: number,
  clamp = false,
  dec?: number
): number => {
  let t = (v - iStart) / (iEnd - iStart);
  if (clamp) t = Math.max(0, Math.min(1, t));
  const res = oStart + t * (oEnd - oStart);
  return dec !== undefined ? Number(res.toFixed(dec)) : res;
};

export const generateUUID = (): UUID => {
  return global.crypto?.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
};

export const toEpochSec = (input: Timestamp | null | undefined): EpochSec | null => {
  if (input == null) return null;
  if (
    typeof input === 'number' ||
    (typeof input === 'string' && /^-?\d+$/.test(input))
  ) {
    const n = Number(input);
    if (!Number.isFinite(n)) return null;
    return Math.floor(Math.abs(n) < 1e11 ? n : n / 1000) as EpochSec;
  }
  if (DateTime.isDateTime(input)) {
    if (!input.isValid) return null;
    return Math.floor(input.toSeconds()) as EpochSec;
  }
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    return Math.floor(input.getTime() / 1000) as EpochSec;
  }
  if (typeof input === 'string') {
    const iso = DateTime.fromISO(input);
    if (iso.isValid) return Math.floor(iso.toSeconds()) as EpochSec;
    const rfc = DateTime.fromRFC2822(input);
    if (rfc.isValid) return Math.floor(rfc.toSeconds()) as EpochSec;
    const norm = new Date(input).getTime();
    if (!isNaN(norm)) return Math.floor(norm / 1000) as EpochSec;
  }
  return null;
}

export const fromEpochSec = (input: EpochSec): DateTime => {
  return DateTime.fromSeconds(input);
}

export const toISODate = (input: Timestamp | null | undefined): ISODate | null => {
  if (DateTime.isDateTime(input) && input.isValid) return input.toISODate() as ISODate;
  const epoch = toEpochSec(input);
  return epoch ? DateTime.fromSeconds(epoch).toISODate() as ISODate : null;
}

export const toCoordinate = (input: number | null | undefined): Coordinate | null => {
  if (input == null || isNaN(input)) return null;
  return Number(Number(input).toFixed(2)) as Coordinate;
};

export const runConcurrent = async <T>(
  tasks: (() => Promise<T>)[],
  limit: number = 5,
  delay: number = 50
): Promise<T[]> => {
  const results: Promise<T>[] = [];
  const executing = new Set<Promise<T>>();

  for (const task of tasks) {
    const p = task().then(res => {
      executing.delete(p);
      return res;
    });

    results.push(p);
    executing.add(p);

    if (executing.size >= limit) await Promise.race(executing);
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
  }

  return Promise.all(results);
};

// -------------------- Logic --------------------

export const SleepLogic = {
  async create({ id, start, end, lat, lon }: {
    id?: UUID
    start: Timestamp,
    end: Timestamp,
    lat: number | null,
    lon: number | null,
  }): Promise<SleepSessionRecord> {
    const startEpoch = toEpochSec(start);
    const endEpoch = toEpochSec(end);

    if (startEpoch == null || endEpoch == null) throw new Error('start and end are required');
    if (endEpoch < startEpoch) throw new Error('end cannot be before start');

    const record: SleepSessionRecord = {
      id: id ?? generateUUID(),
      start: startEpoch,
      end: endEpoch,
      lat: toCoordinate(lat),
      lon: toCoordinate(lon),
      createdAt: toEpochSec(DateTime.now())!
    };

    await db.runAsync(
      `INSERT INTO sleepSessions (id, start, "end", lat, lon, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [record.id, record.start, record.end, record.lat, record.lon, record.createdAt]
    );

    const store = useStorage.getState();
    store.setLastSessionID(record.id);
    store.setSessionCount(store.sessionCount + 1);

    return record;
  },

  async get(id: UUID): Promise<SleepSessionRecord> {
    if (!id) throw new Error('id required');
    const row = await db.getFirstAsync<SleepSessionRecord>(
      `SELECT * FROM sleepSessions WHERE id = ?`,
      [id]
    );
    if (!row) throw new Error('record not found');
    return row;
  },

  async update({ id, start, end, lat, lon }: {
    id: UUID,
    start?: Timestamp,
    end?: Timestamp,
    lat?: number | null,
    lon?: number | null,
  }): Promise<SleepSessionRecord> {
    return await runTransaction(async () => {
      if (!id) throw new Error('id required');

      const existing = await db.getFirstAsync<SleepSessionRecord>(
        `SELECT * FROM sleepSessions WHERE id = ?`,
        [id]
      );
      if (!existing) throw new Error('record not found');


      const updated: SleepSessionRecord = {
        ...existing,
        start: toEpochSec(start) ?? existing.start,
        end: toEpochSec(end) ?? existing.end,
        lat: (lat === null) ? null :
          (toCoordinate(lat) ?? existing.lat),
        lon: (lon === null) ? null :
          (toCoordinate(lon) ?? existing.lon),
      };

      updated.updatedAt = toEpochSec(DateTime.now())!;

      await db.runAsync(
        `UPDATE sleepSessions
     SET start = ?, "end" = ?, lat = ?, lon = ?, updatedAt = ?
     WHERE id = ?`,
        [updated.start, updated.end, updated.lat, updated.lon, updated.updatedAt, id]
      );

      return updated;
    });
  },

  async delete(id: UUID): Promise<boolean> {
    if (!id) throw new Error('id required');

    const result = await db.runAsync(`DELETE FROM sleepSessions WHERE id = ?`, [id]);

    if (result.changes <= 0) return false;

    const store = useStorage.getState();
    store.setSessionCount(Math.max(0, store.sessionCount - 1));
    if (store.lastSessionID === id) store.setLastSessionID(null);

    return true;
  },

  startTracking({ lat, lon }: {
    lat: number | null,
    lon: number | null,
  }): void {
    useStorage.getState().setCurrentSession({
      start: DateTime.now().toISO(),
      lat: toCoordinate(lat),
      lon: toCoordinate(lon),
    });
  },

  async stopTracking({ lat, lon }: {
    lat: number | null,
    lon: number | null,
  }): Promise<SleepSessionRecord> {
    const current = useStorage.getState().currentSession;
    if (!current) throw new Error('no active session to stop');

    const record = await this.create({
      ...current,
      end: DateTime.now().toISO(),
      lat: current.lat ?? toCoordinate(lat),
      lon: current.lon ?? toCoordinate(lon),
    });

    useStorage.getState().setCurrentSession(null);
    return record;
  },

  async list({ rangeStart, rangeEnd, match = 'overlapping' }: {
    rangeStart: Timestamp,
    rangeEnd: Timestamp,
    match?: 'overlapping' | 'contained',
  }): Promise<SleepSessionRecord[]> {
    const rangeStartEpoch = toEpochSec(rangeStart);
    const rangeEndEpoch = toEpochSec(rangeEnd);

    if (rangeStartEpoch == null || rangeEndEpoch == null) throw new Error('rangeStart and rangeEnd required');
    if (rangeEndEpoch < rangeStartEpoch) throw new Error('rangeEnd cannot be before rangeStart');

    const where =
      match === 'contained'
        ? `start >= ? AND "end" <= ?`
        : `"end" >= ? AND start <= ?`;

    return await db.getAllAsync<SleepSessionRecord>(
      `SELECT * FROM sleepSessions WHERE ${where} ORDER BY "end" ASC`,
      [rangeStartEpoch, rangeEndEpoch]
    );
  },
};

// export const SunLogic = {

//   async put({ date, lat, lon, sunrise, sunset }: {
//     date: ISODate,
//     lat: Coordinate,
//     lon: Coordinate,
//     sunrise: Timestamp,
//     sunset: Timestamp,
//   }): Promise<SunTimesRecord> {
//     const sunriseEpoch = toEpochSec(sunrise);
//     const sunsetEpoch = toEpochSec(sunset);

//     if (sunriseEpoch == null || sunsetEpoch == null) throw new Error('sunrise and sunset required');

//     const record: SunTimesRecord = {
//       id: `${date}_${lat}_${lon}`,
//       date: date,
//       lat: roundLatLon(lat)!,
//       lon: roundLatLon(lon)!,
//       sunrise,
//       sunset,
//       updatedAt: toEpochSec(DateTime.now())!
//     };

//     await exec(
//       `INSERT OR REPLACE INTO sunTimes
//          (id,date,lat,lon,sunrise,sunset,updatedAt)
//          VALUES (?,?,?,?,?,?,?)`,
//       Object.values(record)
//     );

//     return record;
//   },

//   async request(date: IsoDate, lat: Coordinate, lon: Coordinate): Promise<SunTimesRecord> {
//     const id = `${date}_${lat}_${lon}`;
//     const cached = await db.getFirstAsync<SunTimesRecord>(`SELECT * FROM sunTimes WHERE id = ?`, [id]);
//     if (cached) return cached;

//     const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`;
//     const res = await fetch(url);
//     const data = await res.json();

//     const record: SunTimesRecord = {
//       id: id as any,
//       date,
//       lat,
//       lon,
//       sunrise: toEpochSec(data.results.sunrise)!,
//       sunset: toEpochSec(data.results.sunset)!,
//       updatedAt: toEpochSec(DateTime.now())!
//     };

//     await db.runAsync(
//       `INSERT OR REPLACE INTO sunTimes (id, date, lat, lon, sunrise, sunset, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [record.id, record.date, record.lat, record.lon, record.sunrise, record.sunset, record.updatedAt]
//     );
//     return record;
//   },

//   async requestRange(rangeStart: Timestamp, rangeEnd: Timestamp, lat: Coordinate, lon: Coordinate): Promise<SunTimesRecord[]> {
//     const start = DateTime.fromSeconds(toEpochSec(rangeStart)!).startOf('day');
//     const end = DateTime.fromSeconds(toEpochSec(rangeEnd)!).startOf('day');

//     const tasks: (() => Promise<SunTimesRecord>)[] = [];
//     let curr = start;
//     while (curr <= end) {
//       const d = curr.toISODate() as IsoDate;
//       tasks.push(() => this.request(d, lat, lon));
//       curr = curr.plus({ days: 1 });
//     }
//     return _runConcurrent(tasks, 3);
//   }
// };

// export const StatsLogic = {
//   async getGraph(rangeStart: Timestamp, rangeEnd: Timestamp, maxHeight: number = 100): Promise<GraphResults> {
//     const records = await SleepLogic.list(rangeStart, rangeEnd);
//     const results: GraphResults = {};

//     let curr = DateTime.fromSeconds(toEpochSec(rangeStart)!).startOf('day');
//     const end = DateTime.fromSeconds(toEpochSec(rangeEnd)!).endOf('day');

//     while (curr <= end) {
//       results[curr.toISODate()!] = { durationSeconds: 0, durationTime: '00:00:00', height: 0 };
//       curr = curr.plus({ days: 1 });
//     }

//     records.forEach(r => {
//       const date = DateTime.fromSeconds(r.end).toISODate();
//       if (date && results[date]) {
//         const dur = r.end - r.start;
//         results[date].durationSeconds += dur;
//         results[date].durationTime = Duration.fromMillis(results[date].durationSeconds * 1000).toFormat('hh:mm:ss');
//       }
//     });

//     const maxDur = Math.max(...Object.values(results).map(d => d.durationSeconds), 1);
//     Object.keys(results).forEach(k => {
//       results[k].height = rangeLerp(results[k].durationSeconds, 0, maxDur, 0, maxHeight);
//     });

//     return results;
//   },

//   async getIntervalTimeline(rangeStart: Timestamp, rangeEnd: Timestamp, lat: Coordinate, lon: Coordinate): Promise<IntervalTimeline> {
//     const sessions = await SleepLogic.list(rangeStart, rangeEnd);
//     const suns = await SunLogic.requestRange(rangeStart, rangeEnd, lat, lon);

//     const timeline: IntervalTimeline = {};
//     suns.forEach(sun => {
//       timeline[sun.date] = { sun, sessions: sessions.filter(s => DateTime.fromSeconds(s.end).toISODate() === sun.date) };
//     });
//     return timeline;
//   }
// };