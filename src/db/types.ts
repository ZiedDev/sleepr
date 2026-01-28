export interface SleepSessionRecord {
    id: string;           // uuid
    start: number;        // epoch seconds
    end: number;          // epoch seconds
    lat: number | null;   // 2 decimal precision
    lon: number | null;   // 2 decimal precision
    createdAt?: number;   // epoch seconds
    updatedAt?: number;   // epoch seconds
}

export interface SunTimesRecord {
    id: string;           // YYYY-MM-DD_lat_lon
    date: string;         // YYYY-MM-DD
    lat: number;          // 2 decimal precision
    lon: number;          // 2 decimal precision
    sunrise: number;      // epoch seconds
    sunset: number;       // epoch seconds
    updatedAt?: number;   // epoch seconds
}

export interface CurrentSession {
    start: string;        // ISO string
    end?: string;         // ISO string
    lat?: number;         // 2 decimal precision
    lon?: number;         // 2 decimal precision
}
