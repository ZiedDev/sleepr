import { DateTime, Duration } from 'luxon';

export type UUID = string;
export type Timestamp = DateTime | Date | EpochSec | string;
export type EpochSec = number & { __brand: 'EpochSec' };     // Unix epoch seconds
export type ISODate = string & { __brand: 'ISODate' };       // YYYY-MM-DD
export type Coordinate = number & { __brand: 'Coordinate' }; // 2 decimal precision / ~1.1km / ~2min sunset

export interface SleepSessionRecord {
    readonly id: UUID;
    start: EpochSec;
    end: EpochSec;
    lat: Coordinate | null;
    lon: Coordinate | null;
    createdAt: EpochSec;
    updatedAt?: EpochSec;
}

export interface SunTimesRecord {
    date: ISODate;
    lat: Coordinate;
    lon: Coordinate;
    sunrise: EpochSec;
    sunset: EpochSec;
    updatedAt?: EpochSec;
}

export interface CurrentSession {
    start: EpochSec;
    end?: EpochSec;
    lat?: Coordinate | null;
    lon?: Coordinate | null;
}

// -------------------- Statistics --------------------

export interface TimeMeanResult {
    concentration: number;   // R value (0 to 1)
    meanSeconds: number;     // mean seconds from start of day
    meanTime: string;        // mean time of day HH:mm:ss
}

export interface AveragesResult {
    start: TimeMeanResult;   // average sleep start
    end: TimeMeanResult;     // average sleep end
    duration: {              // average sleep duration
        meanSeconds: number;
        meanTime: string;    // HH:mm:ss
    };
}

export interface GraphDataPoint {
    durationSeconds: number; // duration slept on date
    durationTime: string;    // HH:mm:ss
    height: number;          // rescaled duration as height
}

export type GraphResults = Record<ISODate, GraphDataPoint>;

export interface IntervalTimeline {
    rangeStart: EpochSec;
    rangeEnd: EpochSec;
    sleepSessions: SleepSessionRecord[];
    sunTimes: SunTimesRecord[];
    leftTimeShifts: number[];
    leftWidthShifts: number[];
    rightTimeShifts: number[];
    rightWidthShifts: number[];
}

export interface SplitInterval {
    intervalStart: EpochSec;
    intervalEnd: EpochSec;
    sleepSessions: SleepSessionRecord[];
    sunTimes: (SunTimesRecord | undefined)[];
}

// -------------------- Data --------------------

export interface ExportData {
    meta: {
        exportedAt: string;
    };
    sleepSessions: SleepSessionRecord[];
    sunTimes: SunTimesRecord[];
}