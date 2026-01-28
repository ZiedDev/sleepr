/* ----------------------------- core record types ---------------------------- */

export interface SleepSessionRecord {
    id: string;
    start: number;        // epoch seconds
    end: number;          // epoch seconds
    lat: number | null;
    lon: number | null;
    createdAt?: number;
    updatedAt?: number;
}

export interface SunTimesRecord {
    id: string;           // YYYY-MM-DD_lat_lon
    date: string;         // YYYY-MM-DD
    lat: number;
    lon: number;
    sunrise: number;      // epoch seconds
    sunset: number;       // epoch seconds
    updatedAt?: number;
}

/* ------------------------------ helper shapes ------------------------------ */

export interface RangeInput {
    rangeStart: number | string | Date;
    rangeEnd: number | string | Date;
}

export interface CurrentSession {
    start: string;        // ISO string
    end?: string;         // ISO string
    lat?: number | null;
    lon?: number | null;
}
