import { DateTime, Duration } from 'luxon';
import { useStorage } from './storage';
import { db } from './db';
import {
  UUID, Timestamp, EpochSec, ISODate, Coordinate, SleepSessionRecord, SunTimesRecord, CurrentSession, TimeMeanResult, AveragesResult, GraphDataPoint, GraphResults, IntervalTimeline, SplitInterval, ExportData
} from './types';

// -------------------- Utilities & Consts --------------------

const CONCURRENCY_LIMIT = 5;
const CONCURRENCY_DELAY_MS = 50;
const DS = 86400; // 24*60*60 (seconds in a day)

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

export const initDB = async () => await db.init();

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

    if (startEpoch == null || endEpoch == null) throw new Error("[logic] Start and end are required");
    if (endEpoch < startEpoch) throw new Error("[logic] End cannot be before start");

    const record: SleepSessionRecord = {
      id: id ?? generateUUID(),
      start: startEpoch,
      end: endEpoch,
      lat: toCoordinate(lat),
      lon: toCoordinate(lon),
      createdAt: toEpochSec(DateTime.now())!
    };

    await db.upsertSleep(record);

    const store = useStorage.getState();
    store.setLastSessionID(record.id);
    store.setSessionCount(store.sessionCount + 1);

    return record;
  },

  async get(id: UUID): Promise<SleepSessionRecord | null> {
    if (!id) throw new Error("[logic] ID is required");
    return db.getSleep(id);
  },

  async update({ id, start, end, lat, lon }: {
    id: UUID,
    start?: Timestamp,
    end?: Timestamp,
    lat?: number | null,
    lon?: number | null,
  }): Promise<SleepSessionRecord> {
    return await db.runTransaction(async () => {
      if (!id) throw new Error("[logic] ID is required");

      const existing = await db.getSleep(id);
      if (!existing) throw new Error("[logic] Record not found");

      const nowEpoch: EpochSec = toEpochSec(DateTime.now())!;

      const updated: SleepSessionRecord = {
        ...existing,
        start: toEpochSec(start) ?? existing.start,
        end: toEpochSec(end) ?? existing.end,
        lat: (lat === null) ? null :
          (toCoordinate(lat) ?? existing.lat),
        lon: (lon === null) ? null :
          (toCoordinate(lon) ?? existing.lon),
        updatedAt: nowEpoch,
      };

      await db.upsertSleep(updated);

      return updated;
    });
  },

  async delete(id: UUID): Promise<boolean> {
    if (!id) throw new Error("[logic] ID is required");

    const result = await db.deleteSleep(id);

    if (!result) return false;

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
      start: toEpochSec(DateTime.now())!,
      lat: toCoordinate(lat),
      lon: toCoordinate(lon),
    });
  },

  async stopTracking({ lat, lon, minDuration = Duration.fromObject({ minutes: 15 }) }: {
    lat: number | null;
    lon: number | null;
    minDuration?: Duration;
  }): Promise<SleepSessionRecord> {
    const current = useStorage.getState().currentSession;
    if (!current) throw new Error("[logic] No active session to stop");

    // enforce location save
    if (!lat || !lon) throw new Error("[logic] Latitude and longitude are required");

    const session = {
      ...current,
      end: toEpochSec(DateTime.now())!,
      lat: current.lat ?? toCoordinate(lat),
      lon: current.lon ?? toCoordinate(lon),
    }

    // enforce minimum duration
    if (minDuration) {
      const durationSec = session.end - session.start;
      const minSec = minDuration.as('seconds');
      if (durationSec < minSec) throw new Error(`[logic] Sleep session too short: ${durationSec}s recorded; minimum is ${minSec}s`);
    }

    const record = await this.create(session);

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

    if (rangeStartEpoch == null || rangeEndEpoch == null) throw new Error("[logic] rangeStart and rangeEnd are required");
    if (rangeEndEpoch < rangeStartEpoch) throw new Error("[logic] rangeEnd cannot be before rangeStart");

    const where =
      match === 'contained'
        ? `start >= ? AND "end" <= ?`
        : `"end" >= ? AND start <= ?`;

    return await db.listSleep(rangeStartEpoch, rangeEndEpoch, match);
  },
};

export const SunLogic = {
  async put({ date, lat, lon, sunrise, sunset }: {
    date: Timestamp,
    lat: number,
    lon: number,
    sunrise: Timestamp,
    sunset: Timestamp,
  }): Promise<SunTimesRecord> {
    const sunriseEpoch = toEpochSec(sunrise);
    const sunsetEpoch = toEpochSec(sunset);

    if (sunriseEpoch == null || sunsetEpoch == null) throw new Error("[logic] Sunrise and sunset are required");

    const dateISO = toISODate(date);
    const latCoordinate = toCoordinate(lat);
    const lonCoordinate = toCoordinate(lon);

    if (dateISO == null ||
      latCoordinate == null ||
      lonCoordinate == null
    ) throw new Error("[logic] Date, latitude, and longitude are required");

    const nowEpoch: EpochSec = toEpochSec(DateTime.now())!;

    const record: SunTimesRecord = {
      date: dateISO,
      lat: latCoordinate,
      lon: lonCoordinate,
      sunrise: sunriseEpoch,
      sunset: sunsetEpoch,
      updatedAt: nowEpoch,
    };

    await db.upsertSun(record);

    return record;
  },

  async get({ date, lat, lon }: {
    date: Timestamp,
    lat: number,
    lon: number,
  }): Promise<SunTimesRecord | null> {
    const dateISO = toISODate(date);
    const latCoordinate = toCoordinate(lat);
    const lonCoordinate = toCoordinate(lon);

    if (dateISO == null ||
      latCoordinate == null ||
      lonCoordinate == null
    ) throw new Error("[logic] Date, latitude, and longitude are required");

    return db.getSun(dateISO, latCoordinate, lonCoordinate);
  },

  async list({ dateStart, dateEnd, lat, lon }: {
    dateStart: Timestamp,
    dateEnd: Timestamp,
    lat: number,
    lon: number,
  }): Promise<SunTimesRecord[]> {
    const dateStartISO = toISODate(dateStart);
    const dateEndISO = toISODate(dateEnd);

    if (dateStartISO == null || dateEndISO == null) {
      throw new Error("[logic] dateStart and dateEnd are required");
    }
    if (dateEndISO < dateStartISO) throw new Error("[logic] dateEnd cannot be before dateStart");

    const latCoordinate = toCoordinate(lat);
    const lonCoordinate = toCoordinate(lon);

    if (latCoordinate == null || lonCoordinate == null) throw new Error("[logic] Latitude and longitude are required");


    return await db.listSun(latCoordinate, lonCoordinate, dateStartISO, dateEndISO);
  },

  async request({ date, lat, lon }: {
    date: Timestamp,
    lat: number,
    lon: number,
  }): Promise<SunTimesRecord> {
    const cached = await this.get({ date, lat, lon });
    if (cached) return cached;

    const dateISO = toISODate(date);
    const latCoordinate = toCoordinate(lat);
    const lonCoordinate = toCoordinate(lon);

    if (dateISO == null ||
      latCoordinate == null ||
      lonCoordinate == null
    ) throw new Error("[logic] Date, latitude, and longitude are required");


    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${dateISO}&formatted=0`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`[logic] Sunrise-Sunset API error: ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OK') throw new Error(`[logic] API returned status: ${data.status}`);

    return await this.put({
      date,
      lat,
      lon,
      sunrise: data.results.sunrise,
      sunset: data.results.sunset
    });
  },

  async requestList({ dateStart, dateEnd, lat, lon }: {
    dateStart: Timestamp,
    dateEnd: Timestamp,
    lat: number,
    lon: number,
  }): Promise<SunTimesRecord[]> {
    const startEpoch = toEpochSec(dateStart);
    const endEpoch = toEpochSec(dateEnd);

    if (startEpoch == null || endEpoch == null) {
      throw new Error("[logic] dateStart and dateEnd are required");
    }
    if (endEpoch < startEpoch) throw new Error("[logic] dateEnd cannot be before dateStart");

    const latCoordinate = toCoordinate(lat);
    const lonCoordinate = toCoordinate(lon);

    if (latCoordinate == null || lonCoordinate == null) throw new Error("[logic] Latitude and longitude are required");

    const cached = await this.list({ dateStart, dateEnd, lat, lon });
    const cachedMap = new Map(cached.map(r => [r.date, r]));

    const results: SunTimesRecord[] = [];
    const fetchTasks: (() => Promise<SunTimesRecord>)[] = [];

    let currDay = fromEpochSec(startEpoch).startOf('day');
    const endDay = fromEpochSec(endEpoch).endOf('day');

    while (currDay <= endDay) {
      const dateISO = toISODate(currDay)!;
      if (cachedMap.has(dateISO)) {
        results.push(cachedMap.get(dateISO)!);
      } else {
        fetchTasks.push(() => this.request({ date: dateISO, lat, lon }));
      }
      currDay = currDay.plus({ days: 1 });
    }

    const fetched = await runConcurrent(fetchTasks, CONCURRENCY_LIMIT, CONCURRENCY_DELAY_MS);
    const allResults = [...results, ...fetched];
    allResults.sort((a, b) => a.date.localeCompare(b.date));

    return allResults;
  },
};

export const StatsLogic = {
  _timeMean(epochSecs: EpochSec[]): TimeMeanResult {
    const secsOfDay = epochSecs.map(s => {
      const d = fromEpochSec(s);
      return d.diff(d.startOf('day')).as('seconds');
    });

    const n = secsOfDay.length;
    let C = 0, S = 0;
    secsOfDay.forEach(s => {
      const theta = 2 * Math.PI * (s / DS);
      C += Math.cos(theta);
      S += Math.sin(theta);
    });
    C /= n; S /= n;

    const R = Math.hypot(C, S);
    let meanAngle = Math.atan2(S, C);
    if (meanAngle < 0) meanAngle += 2 * Math.PI;

    const meanSeconds = (meanAngle / (2 * Math.PI)) * DS;
    const meanTime = DateTime.now().startOf('day').plus({ seconds: meanSeconds }).toFormat('HH:mm:ss');

    return { concentration: R, meanSeconds, meanTime };
  },

  getAverages(records: SleepSessionRecord[]): AveragesResult {
    if (records.length === 0) throw new Error("[logic] No records provided");

    const startMean = this._timeMean(records.map(r => r.start));
    const endMean = this._timeMean(records.map(r => r.end));

    const totalDuration = records.reduce((acc, r) => acc + (r.end - r.start), 0);
    const avgSeconds = totalDuration / records.length;

    return {
      start: startMean,
      end: endMean,
      duration: {
        meanSeconds: avgSeconds,
        meanTime: Duration.fromMillis(avgSeconds * 1000).toFormat('hh:mm:ss')
      }
    };
  },

  getGraph(records: SleepSessionRecord[], maxHeight = 100): GraphResults {
    if (records.length === 0) return {};

    const recordEnds = records.map(r => r.end);
    const rangeStart = Math.min(...records.map(r => r.start));
    const rangeEnd = Math.max(...recordEnds);

    const recordsMap: Record<string, number> = {};
    let currDay = fromEpochSec(rangeStart as EpochSec).startOf('day');
    const endDay = fromEpochSec(rangeEnd as EpochSec).endOf('day');

    while (currDay <= endDay) {
      const iso = currDay.toISODate()!;
      recordsMap[iso] = 0;
      currDay = currDay.plus({ days: 1 });
    }

    records.forEach(record => {
      const iso = fromEpochSec(record.end).toISODate()!;
      if (recordsMap[iso] !== undefined) {
        recordsMap[iso] += (record.end - record.start);
      }
    });

    const maxDuration = Math.max(...Object.values(recordsMap), 1);
    const results: GraphResults = {};

    for (const [date, durationSeconds] of Object.entries(recordsMap)) {
      results[date as ISODate] = {
        durationSeconds,
        durationTime: Duration.fromMillis(durationSeconds * 1000).toFormat('hh:mm:ss'),
        height: rangeLerp(durationSeconds, 0, maxDuration, 0, maxHeight)
      };
    }

    return results;
  },

  /**
   * Builds the data needed for a horizontal "Lifeline" style view.
   */
  async getIntervalTimeline(
    records: SleepSessionRecord[],
    { lat, lon, width = 100 }: { lat: number, lon: number, width?: number }
  ): Promise<IntervalTimeline> {
    if (records.length === 0) throw new Error("[logic] No records provided");

    // Sort by middle point for visual continuity
    const processed = records.map(r => ({ ...r, middle: (r.start + r.end) / 2 }));
    processed.sort((a, b) => a.middle - b.middle);

    const rangeStart = (processed[0].middle - DS * 0.5) as EpochSec;
    const rangeEnd = (processed[processed.length - 1].middle + DS * 0.5) as EpochSec;

    const sunRecords = await SunLogic.requestList({ dateStart: rangeStart, dateEnd: rangeEnd, lat, lon });

    const middles = processed.map(r => r.middle);
    const totalTimeRange = rangeEnd - rangeStart;

    const leftTimeShifts = middles.map(m => m - middles[0]);
    const rightTimeShifts = middles.map(m => middles[middles.length - 1] - m);

    const leftWidthShifts = leftTimeShifts.map(ts => rangeLerp(ts, 0, totalTimeRange, 0, width));
    const rightWidthShifts = rightTimeShifts.map(ts => rangeLerp(ts, 0, totalTimeRange, 0, width));

    return {
      rangeStart,
      rangeEnd,
      sleepSessions: processed,
      sunTimes: sunRecords,
      leftTimeShifts,
      leftWidthShifts,
      rightTimeShifts,
      rightWidthShifts
    };
  },

  /**
   * Splits data into periodic intervals (e.g. 24h chunks).
   */
  async getSplitIntervals(
    records: SleepSessionRecord[],
    { splitDays = 1, lat, lon }: { splitDays?: number, lat: number, lon: number }
  ): Promise<SplitInterval[]> {
    if (records.length === 0) return [];

    const rangeStart = Math.min(...records.map(r => r.start));
    const rangeEnd = Math.max(...records.map(r => r.end));
    const splitSecs = splitDays * DS;

    const firstStart = fromEpochSec(rangeStart as EpochSec).startOf('day');
    const lastEnd = fromEpochSec(rangeEnd as EpochSec).endOf('day');

    const sunRecords = await SunLogic.requestList({ dateStart: firstStart, dateEnd: lastEnd, lat, lon });
    const sunMap = new Map(sunRecords.map(s => [s.date, s]));

    const intervals: SplitInterval[] = [];
    let curr = firstStart;

    while (curr < lastEnd) {
      const iStart = toEpochSec(curr)!;
      const iEnd = (iStart + splitSecs) as EpochSec;

      const sessionsInInterval = records.filter(r => r.end >= iStart && r.start <= iEnd);

      // Collect sun records that touch this interval
      const intervalSun: (SunTimesRecord | undefined)[] = [];
      let sunCurr = curr.startOf('day');
      const sunEnd = fromEpochSec(iEnd).endOf('day');
      while (sunCurr <= sunEnd) {
        intervalSun.push(sunMap.get(toISODate(sunCurr)! as ISODate));
        sunCurr = sunCurr.plus({ days: 1 });
      }

      intervals.push({
        intervalStart: iStart,
        intervalEnd: iEnd,
        sleepSessions: sessionsInInterval,
        sunTimes: intervalSun
      });

      curr = curr.plus({ seconds: splitSecs });
    }

    return intervals;
  },
};

export const DataLogic = {
  async exportToObject(): Promise<ExportData> {
    const [sleep, sun] = await Promise.all([
      db.getAllSleep(),
      db.getAllSun(),
    ]);

    return {
      meta: {
        exportedAt: new Date().toISOString() as ISODate,
      },
      sleepSessions: sleep,
      sunTimes: sun,
    };
  },

  async importFromObject(
    data: ExportData,
    options?: {
      clearExisting?: boolean;
    }
  ): Promise<void> {
    await db.runTransaction(async () => {
      if (options?.clearExisting) {
        await db.clearAll();
      }

      for (const record of data.sleepSessions) {
        await db.upsertSleep(record);
      }

      for (const record of data.sunTimes) {
        await db.upsertSun(record);
      }
    });
  },

  async exportToFile(): Promise<void> {
    const obj = await this.exportToObject();
    await db.exportJSON(
      obj,
      `sleepr_data_export_${new Date().toISOString()}`
    );
  },

  async importFromFile(options?: {
    clearExisting?: boolean;
  }): Promise<void> {
    const obj = await db.importJSON() as ExportData;
    await this.importFromObject(obj, options);
  },
}