import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

// -------------------- Constants --------------------
const DB_NAME = 'sleep-sun-db';
const DB_VERSION = 1;
const SLEEP_STORE = 'sleepSessions';
const SUN_STORE = 'sunTimes';
const DS = 86400 // 60*60*24


// -------------------- Utilities --------------------
export class StoredValue {
    constructor(localStorageName, defaultValue = false, updateCallback = (self) => { }) {
        this._name = localStorageName;
        this._callback = updateCallback;
        try {
            const raw = localStorage.getItem(this._name);
            this._value = (raw == null ? defaultValue : JSON.parse(raw));
        } catch (e) {
            this._value = defaultValue;
        }
    }
    update() {
        localStorage.setItem(this._name, JSON.stringify(this._value));
        this._callback(this);
    }
    get val() { return this._value; }
    set val(value) { this._value = value; this.update(); }
    clear() { localStorage.removeItem(this._name); this._value = undefined; }
}

export function rangeLerp({
    inputValue,
    inputRangeStart = 0,
    inputRangeEnd = 1,
    outputRangeStart,
    outputRangeEnd,
    capInput = false,
    decimalPlaces = 1
} = {}) {
    let t = inputValue;
    if (capInput) t = Math.max(Math.min(t, inputRangeEnd), inputRangeStart);
    let res = outputRangeStart + (outputRangeEnd - outputRangeStart) * ((t - inputRangeStart) / (inputRangeEnd - inputRangeStart));
    return Number(res.toFixed(decimalPlaces));
}

export function uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function toEpochSec(input) {
    if (input == null) return null;
    if (typeof input === 'number') return Math.floor(input < 1e11 ? input : input / 1000);
    if (input instanceof Date) return Math.floor(input.getTime() / 1000);
    const d = new Date(input).getTime();
    if (!isNaN(d)) return Math.floor(d / 1000);
    return null;
}

export function fromEpochSec(epochSec) {
    if (epochSec == null) return null;
    return new Date(Number(epochSec) * 1000);
}

export function toISODate(epochSec) {
    if (epochSec == null) return null;
    return fromEpochSec(epochSec).toISOString().slice(0, 10)
}

export function roundLatLon(input) {
    if (input == null || isNaN(input)) return null;
    return Number(Number(input).toFixed(2));
}

// -------------------- Logic --------------------
class Logic {
    constructor() {
        this.lastSessionID = new StoredValue('lastSessionID', null);
        this.sessionCount = new StoredValue('sessionCount', 0);
        this.currentSession = new StoredValue('currentSession', null);

        this._dbPromise = null;

        this.sleepSession = this._makeSleepNamespace();
        this.sunTimes = this._makeSunNamespace();
        this.statistics = this._makeStatisticsNamespace();

        this._initDB();
    }

    async _initDB() {
        if (this._dbPromise) return this._dbPromise;

        this._dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldV, newV, transaction) {
                if (!db.objectStoreNames.contains(SLEEP_STORE)) {
                    const s = db.createObjectStore(SLEEP_STORE, { keyPath: 'id' });
                    s.createIndex('byStart', 'start');
                    s.createIndex('byEnd', 'end');
                }
                if (!db.objectStoreNames.contains(SUN_STORE)) {
                    const sun = db.createObjectStore(SUN_STORE, { keyPath: 'id' });
                    sun.createIndex('byDate', 'date');
                }
            }
        });

        return this._dbPromise;
    }

    async _getDB() {
        if (!this._dbPromise) await this._initDB();
        return this._dbPromise;
    }

    async _deleteDB() {
        if (this._dbPromise) {
            try {
                const db = await this._dbPromise;
                db.close();
            } catch (e) { }
        }
        this._dbPromise = null;

        return new Promise((resolve, reject) => {
            const req = indexedDB.deleteDatabase(DB_NAME);

            req.onsuccess = () => {
                this.lastSessionID.clear();
                this.sessionCount.clear();
                this.currentSession.clear();
                resolve(true);
            };

            req.onerror = () => {
                reject(req.error || new Error('IndexedDB deleteDatabase failed'));
            }

            req.onblocked = () => {
                reject(new Error('deleteDatabase blocked'));
            }
        });
    }

    _makeSleepNamespace() {
        const self = this;
        return {

            async create({ start, end, lat = null, lon = null, id = null } = {}) {
                if (toEpochSec(start) == null || toEpochSec(end) == null) throw new Error('start and end required');
                const db = await self._getDB();
                const record = {
                    id: id ?? uuid(),
                    start: toEpochSec(start),
                    end: toEpochSec(end),
                    lat: roundLatLon(lat),
                    lon: roundLatLon(lon),
                    createdAt: toEpochSec(Date.now())
                };
                await db.put(SLEEP_STORE, record);
                self.sessionCount.val += 1;
                self.lastSessionID.val = record.id;
                return record;
            },

            async get(id) {
                if (!id) throw new Error('id required');
                const db = await self._getDB();
                return db.get(SLEEP_STORE, id);
            },

            async update({ id, start = null, end = null, lat = null, lon = null } = {}) {
                if (!id) throw new Error('id required');
                const db = await self._getDB();
                const existing = await db.get(SLEEP_STORE, id);
                if (!existing) throw new Error('record not found');
                const updated = Object.assign({}, existing, {
                    start: toEpochSec(start) ?? existing.start,
                    end: toEpochSec(end) ?? existing.end,
                    lat: roundLatLon(lat) ?? existing.lat,
                    lon: roundLatLon(lon) ?? existing.lon,
                    updatedAt: toEpochSec(Date.now())
                });
                await db.put(SLEEP_STORE, updated);
                return updated;
            },

            async delete(id) {
                if (!id) throw new Error('id required');
                const db = await self._getDB();
                const tx = db.transaction(SLEEP_STORE, 'readwrite');
                const store = tx.objectStore(SLEEP_STORE);
                const keyExists = await store.getKey(id);
                if (!keyExists) {
                    await tx.done;
                    return false;
                }
                await store.delete(id);
                await tx.done;
                self.sessionCount.val -= 1;
                if (self.lastSessionID.val === id) self.lastSessionID.val = null;
                return true;
            },

            start({ lat = null, lon = null } = {}) {
                self.currentSession.val = { start: Date.now(), lat, lon };
            },

            async stop({ lat = null, lon = null } = {}) {
                const session = self.currentSession.val;
                if (!session) throw new Error('no current session started');
                Object.assign(session, {
                    end: Date.now(),
                    lat: lat ?? session.lat,
                    lon: lon ?? session.lon
                });
                if (session.end < session.start) throw new Error('end cannot be before start');
                // if (!session.lat || !session.lon) throw new Error('lat and lon required');
                const record = await this.create(session);
                self.currentSession.val = null;
                return record;
            },

            async list({ rangeStart, rangeEnd } = {}) {
                [rangeStart, rangeEnd] = [toEpochSec(rangeStart), toEpochSec(rangeEnd)];
                if (rangeStart == null || rangeEnd == null) throw new Error('rangeStart and rangeEnd required');
                if (rangeEnd < rangeStart) throw new Error('end cannot be before start');

                const db = await self._getDB();
                const tx = db.transaction(SLEEP_STORE, 'readonly');
                const store = tx.objectStore(SLEEP_STORE);
                const index = store.index('byEnd');

                const sessions = [];
                let cursor = await index.openCursor(IDBKeyRange.lowerBound(rangeStart));
                while (cursor) {
                    const session = cursor.value;
                    if (session.start <= rangeEnd) sessions.push(session);
                    cursor = await cursor.continue();
                }

                await tx.done;
                return sessions;
            },

        }
    }

    _makeSunNamespace() {
        const self = this;
        return {

            _makeId({ date, lat, lon } = {}) {
                if (toEpochSec(date) == null) throw new Error('date required');
                if (roundLatLon(lat) == null || roundLatLon(lon) == null) throw new Error('lat and lon required');
                return `${toISODate(toEpochSec(date))}_${roundLatLon(lat)}_${roundLatLon(lon)}`
            },

            async put({ date, lat, lon, sunrise, sunset } = {}) {
                if (toEpochSec(sunrise) == null || toEpochSec(sunset) == null) throw new Error('sunrise and sunset required');
                const id = this._makeId({ date, lat, lon });
                const db = await self._getDB();
                const d = id.split('_');
                const record = {
                    id,
                    date: d[0],
                    lat: d[1],
                    lon: d[2],
                    sunrise: toEpochSec(sunrise),
                    sunset: toEpochSec(sunset),
                    updatedAt: toEpochSec(Date.now())
                };
                await db.put(SUN_STORE, record);
                return record;
            },

            async get({ date, lat, lon } = {}) {
                const id = this._makeId({ date, lat, lon });
                const db = await self._getDB();
                return db.get(SUN_STORE, id);
            },

            async list({ rangeStart, rangeEnd, lat = null, lon = null } = {}) {
                [rangeStart, rangeEnd] = [toEpochSec(rangeStart), toEpochSec(rangeEnd)];
                [lat, lon] = [roundLatLon(lat), roundLatLon(lon)];
                if (rangeStart == null || rangeEnd == null) throw new Error('rangeStart and rangeEnd required');
                if (rangeEnd < rangeStart) throw new Error('end cannot be before start');

                const startDate = toISODate(rangeStart);
                const endDate = toISODate(rangeEnd);

                const db = await self._getDB();
                const tx = db.transaction(SUN_STORE, 'readonly');
                const store = tx.objectStore(SUN_STORE);
                const index = store.index('byDate');

                const results = await index.getAll(IDBKeyRange.bound(startDate, endDate));
                await tx.done;

                const filtered = results.filter(r =>
                    (lat == null || r.lat == lat) &&
                    (lon == null || r.lon == lon)
                );

                return filtered;
            },

            async request({ date, lat, lon } = {}) {
                const cached = await this.get({ date, lat, lon });
                if (cached) return cached;

                const isoDate = toISODate(toEpochSec(date));
                const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${isoDate}&formatted=0`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`sunrise-sunset.org error: ${res.status}`);
                const data = await res.json();
                if (data.status !== "OK") throw new Error(`API returned ${data.status}`);

                const record = await this.put({
                    date: isoDate,
                    lat,
                    lon,
                    sunrise: data.results.sunrise,
                    sunset: data.results.sunset
                });
                return record;
            },

            async requestList({ rangeStart, rangeEnd, lat, lon } = {}) {
                const cached = await this.list({ rangeStart, rangeEnd, lat, lon });
                const cachedMap = new Map(cached.map(r => [r.date, r]));

                [rangeStart, rangeEnd] = [toEpochSec(rangeStart), toEpochSec(rangeEnd)];

                const results = [];
                for (let t = Math.floor(rangeStart / DS) * DS; t <= Math.floor(rangeEnd / DS) * DS; t += DS) {
                    const date = toISODate(t);
                    if (cachedMap.has(date)) {
                        results.push(cachedMap.get(date));
                    } else {
                        const record = await this.request({ date, lat, lon });
                        results.push(record);
                    }
                }

                return results;
            },

        }
    }

    _makeStatisticsNamespace() {
        const self = this;
        return {

            async getGraph(input, maxHeight = 100) {
                let records, rangeStart, rangeEnd;
                if (Array.isArray(input)) {
                    records = input;
                    if (!records || records.length === 0) throw new Error("0 records in input");
                    const recordEnds = records.map(r => r.end);
                    [rangeStart, rangeEnd] = [Math.min(...recordEnds), Math.max(...recordEnds)];
                } else if (input && typeof input === 'object') {
                    ({ rangeStart, rangeEnd } = input);
                    records = await self.sleepSession.list({ rangeStart, rangeEnd });
                    [rangeStart, rangeEnd] = [toEpochSec(rangeStart), toEpochSec(rangeEnd)];
                    if (!records || records.length === 0) throw new Error("0 records in input");
                } else throw new Error('input must be be either array of records or object');

                const recordsMap = {};
                for (let t = Math.floor(rangeStart / DS) * DS; t <= Math.floor(rangeEnd / DS) * DS; t += DS) {
                    const date = toISODate(t);
                    recordsMap[date] = 0;
                }

                records.forEach(record => {
                    recordsMap[toISODate(record.end)] += record.end - record.start;
                });

                const maxDuration = Math.max(...Object.values(recordsMap));

                const results = {};
                for (const [key, durationSeconds] of Object.entries(recordsMap)) {
                    results[key] = {
                        durationSeconds: durationSeconds,
                        durationTime: `${Math.floor(durationSeconds / 3600 % 60)}:${Math.floor(durationSeconds / 60 % 60)}:${Math.floor(durationSeconds % 60)}`,
                        height: rangeLerp({
                            inputValue: durationSeconds,
                            inputRangeStart: 0,
                            inputRangeEnd: maxDuration,
                            outputRangeStart: 0,
                            outputRangeEnd: maxHeight,
                            capInput: false,
                            decimalPlaces: 2
                        })
                    }
                }

                return results;
            },

            _timeMean(epochSecs) {
                const secsOfDay = epochSecs.map(d => {
                    const date = fromEpochSec(d);
                    const startOfDay = fromEpochSec(d);
                    startOfDay.setHours(0, 0, 0, 0);
                    return Math.floor((date.getTime() - startOfDay.getTime()) / 1000);
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
                const meanTime = new Date(new Date().setHours(0, 0, 0, 0) + meanSeconds * 1000).toTimeString().slice(0, 8);

                return {
                    concentration: R,
                    meanSeconds,
                    meanTime
                }
            },

            async getAverages(input) {
                let records;
                if (Array.isArray(input)) records = input;
                else if (input && typeof input === 'object') {
                    const { rangeStart, rangeEnd } = input;
                    records = await self.sleepSession.list({ rangeStart, rangeEnd });
                } else throw new Error('input must be either array of records or object');
                if (!records || records.length === 0) throw new Error("0 records in input");

                const startMean = this._timeMean(
                    records.map(record => { return record.start; })
                );
                const endMean = this._timeMean(
                    records.map(record => { return record.end; })
                );
                const durationMeanSeconds = records.reduce((acc, record) => {
                    return acc + record.end - record.start;
                }, 0) / records.length;
                const durationMean = {
                    meanSeconds: durationMeanSeconds,
                    meanTime: `${Math.floor(durationMeanSeconds / 3600 % 60)}:${Math.floor(durationMeanSeconds / 60 % 60)}:${Math.floor(durationMeanSeconds % 60)}`
                }

                return {
                    start: startMean,
                    end: endMean,
                    duration: durationMean
                }
            },

            async getSingleSession(sessionID) {
                return null;
            },

            async getAllSessions(input) {
                let records;
                if (Array.isArray(input)) records = input;
                else if (input && typeof input === 'object') {
                    const { rangeStart, rangeEnd, dayStart = 0 } = input;
                    records = await self.sleepSession.list({ rangeStart, rangeEnd });
                } else throw new Error('input must be be either array of records or object');

                return null;
            },

        }
    }

    async exportToObject() {

    }

    async exportToURL() {

    }

    async importFromObject() {

    }
}

export default new Logic();