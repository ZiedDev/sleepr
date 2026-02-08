import { UUID, SleepSessionRecord, SunTimesRecord, ISODate, EpochSec, Coordinate } from './types';

export interface Database {
  init(): Promise<void>;

  // Sleep Sessions
  upsertSleep(record: SleepSessionRecord): Promise<void>;
  getSleep(id: UUID): Promise<SleepSessionRecord | null>;
  deleteSleep(id: UUID): Promise<boolean>;
  listSleep(start: EpochSec, end: EpochSec, match: 'overlapping' | 'contained'): Promise<SleepSessionRecord[]>;
  getAllSleep(): Promise<SleepSessionRecord[]>;

  // Sun Times
  upsertSun(record: SunTimesRecord): Promise<void>;
  getSun(date: ISODate, lat: Coordinate, lon: Coordinate): Promise<SunTimesRecord | null>;
  listSun(lat: Coordinate, lon: Coordinate, start: ISODate, end: ISODate): Promise<SunTimesRecord[]>;
  getAllSun(): Promise<SunTimesRecord[]>;

  // Transactions / Maintenance
  runTransaction<T>(action: () => Promise<T>): Promise<T>;
  clearAll(): Promise<void>;
}