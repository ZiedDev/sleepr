# SleepLogic — API Documentation

> Single exported singleton: `logic` (instance of `Logic`).
> All timestamps are stored **in seconds since epoch**. Latitude & longitude are stored rounded to **2 decimal places**.

---

## Table of contents

1. [Quick import / usage](#quick-import--usage)
2. [Constants & behavior](#constants--behavior)
3. [Persistent vars (StoredValue)](#persistent-vars-storedvalue)
4. [Sleep namespace (CRUD + helpers)](#sleep-namespace-crud--helpers)
5. [Sun-times namespace (CRUD + requests)](#sun-times-namespace-crud--requests)
6. [Statistics namespace (analysis helpers)](#statistics-namespace-analysis-helpers)
7. [Import / Export](#import--export)
8. [Utility helpers](#utility-helpers)
9. [Errors, edge-cases & notes](#errors-edge-cases--notes)

---

## Quick import / usage

```js
import { logic } from './path/to/logic.js';

// e.g. start a live session, later stop and persist
logic.sleepSession.start({ lat: 31.20, lon: 29.92 });
// ...later
const record = await logic.sleepSession.stop();
console.log(record.id, record.start, record.end);
```

All public APIs live under the exported `logic` object:
- `logic.sleepSession` — create/get/update/delete, start & stop, list
- `logic.sunTimes` — put/get/list/request/requestList
- `logic.statistics` — getGraph, getAverages, getIntervalTimeline, getSplitIntervals
- `logic.exportToObject()`, `logic.exportToURL()`, `logic.importFromObject()`

---

## Constants & behavior

- **DB**: `sleep-sun-db` (IndexedDB). Version `1`.
- **Object stores**:
  - `sleepSessions` — keyPath `id`. Indexes: `byStart` (field `start`), `byEnd` (field `end`).
  - `sunTimes` — keyPath `id`. Index: `byDate` (field `date`).
- **Timestamps**: always in **seconds** (integer). Use the helper `toEpochSec` for inputs.
- **Lat/Lon storage**: rounded to 2 decimals via `roundLatLon()` before persisting.
- **Concurrency controls** (used for fetching sun data): `CONCURRENCY_LIMIT = 5`, `CONCURRENCY_DELAY_MS = 50`.

`Logic._initDB()` is called automatically in the constructor; you do not need to call it manually unless you want to reinitialize or delete the DB.

---

## Persistent vars (StoredValue)

These are wrappers around `localStorage` that keep small values persistent across sessions.

- `logic.lastSessionID` — (StoredValue) ID of the most-recently created sleep session (or `null`).
- `logic.sessionCount` — (StoredValue) count of sleep sessions in DB (number).
- `logic.currentSession` — (StoredValue) temporary object used by `sleepSession.start()` to hold an in-progress session.

**StoredValue API**
```js
// constructed inside Logic but helpful to know:
new StoredValue(localStorageName, defaultValue = false, updateCallback = (self) => {})

// properties / methods on instance:
stored.val   // getter
stored.val = x // setter (persists to localStorage and calls callback)
stored.update() // writes to localStorage
stored.clear()  // removes from localStorage
```

---

## Sleep namespace (CRUD + helpers)

Available at `logic.sleepSession`.

### `create({ start, end, lat = null, lon = null, id = null }) -> record`
- **Inputs**:
  - `start` (required) — timestamp or ISO/Date; converted with `toEpochSec()`
  - `end` (required)
  - `lat`, `lon` (optional) — stored rounded to 2 decimals
  - `id` (optional) — if omitted a UUID is generated
- **Returns**: the stored `record` object with fields: `{ id, start, end, lat, lon, createdAt }`.
- **Side-effects**: increments `logic.sessionCount`, sets `logic.lastSessionID`.
- **Errors**: throws if `start` or `end` cannot be converted to epoch seconds.

### `get(id) -> record`
- **Inputs**: `id` (required)
- **Returns**: session record or `undefined` if not found.
- **Errors**: throws if `id` is falsy.

### `update({ id, start = null, end = null, lat = null, lon = null }) -> record`
- **Inputs**: `id` (required) and any fields to change.
- **Behavior**: partial updates only — unchanged fields remain.
- **Returns**: updated record.
- **Errors**: throws if `id` missing or record not found.

### `delete(id) -> boolean`
- **Inputs**: `id` (required)
- **Returns**: `true` if deleted, `false` if key not found.
- **Side-effects**: decrements `logic.sessionCount` and clears `logic.lastSessionID` if it matched.

### `start({ lat = null, lon = null })`
- **Behavior**: sets `logic.currentSession.val = { start: DateTime.now().toISO(), lat, lon }`.
- **Note**: this stores start as ISO string in `currentSession`; `stop()` converts to epoch seconds before persisting.

### `stop({ lat = null, lon = null }) -> record`
- **Behavior**: reads `logic.currentSession.val`, appends `end: DateTime.now().toISO()` (and optional lat/lon override), validates end >= start, creates a DB record via `create()` and clears `currentSession`.
- **Returns**: the created `record`.
- **Errors**: throws if there is no `currentSession` or `end < start`.

### `list({ rangeStart, rangeEnd }) -> records[]`
- **Inputs**: `rangeStart` and `rangeEnd` — accepted in any format supported by `toEpochSec()` (required).
- **Behavior**: returns **all sessions that overlap** the given range (partially or fully).
  - Implementation uses the `byEnd` index and iterates starting from `lowerBound(rangeStart)`; it adds sessions whose `start <= rangeEnd`.
- **Errors**: throws if inputs invalid or `rangeEnd < rangeStart`.

**Example: list last 7 days**
```js
const end = DateTime.now();
const start = DateTime.now().minus({days: 7});
const sessions = await logic.sleepSession.list({ rangeStart: start, rangeEnd: end });
```

---

## Sun-times namespace (CRUD + requests)

Available at `logic.sunTimes`.

> IDs are strings of the form: `YYYY-MM-DD_lat_lon` where `lat` and `lon` are rounded to two decimals.

### `_makeId({ date, lat, lon })` (internal)
- Validates `date` and rounded `lat/lon`, returns the `id` string.

### `put({ date, lat, lon, sunrise, sunset }) -> record`
- **Inputs**:
  - `date` — any input compatible with `toISODate()` (e.g. Date/ISO/epoch)
  - `lat`, `lon` — required (will be rounded)
  - `sunrise`, `sunset` — required; converted to epoch seconds
- **Returns**: saved `record` with `{ id, date, lat, lon, sunrise, sunset, updatedAt }`.
- **Errors**: throws if `sunrise` or `sunset` cannot be converted.

### `get({ date, lat, lon }) -> record`
- **Returns**: the sunTimes record or `undefined`.

### `list({ rangeStart, rangeEnd, lat = null, lon = null }) -> records[]`
- **Inputs**: `rangeStart`, `rangeEnd` required (converted to dates internally);
  optional `lat`/`lon` to filter.
- **Behavior**: queries the `byDate` index for the date range and then filters by `lat`/`lon` if provided.

### `request({ date, lat, lon }) -> record`
- **Behavior**: calls `https://api.sunrise-sunset.org/json?lat=...&lng=...&date=YYYY-MM-DD&formatted=0` to fetch sunrise/sunset times in ISO format. If successful, `put()` is called to cache the result and the record is returned.
- **Errors**: throws on network error or API non-OK response.

### `requestList({ rangeStart, rangeEnd, lat, lon }) -> records[]`
- **Inputs**: `rangeStart`, `rangeEnd`, `lat`, `lon` — `lat/lon` are required.
- **Behavior**:
  - First calls `list()` to obtain cached days.
  - Builds a list of missing date fetch tasks and then runs them concurrently using `_runConcurrent()` with `CONCURRENCY_LIMIT` and `CONCURRENCY_DELAY_MS`.
  - Returns a combined, sorted array of sun records between `rangeStart` and `rangeEnd`.

### `_runConcurrent(tasks, limit, delay)` (internal)
- Accepts an array of functions that return Promises. Runs up to `limit` concurrently and introduces `delay` ms between starting tasks to be gentle on the API.

---

## Statistics namespace (analysis helpers)

Available at `logic.statistics`.

All statistics helpers accept either:
- an **array of session records** (as returned by `sleepSession.list()`), or
- an **object** like `{ rangeStart, rangeEnd }` — in that case the function will call `sleepSession.list(...)` internally.

### `getGraph(input, maxHeight = 100) -> { [YYYY-MM-DD]: { durationSeconds, durationTime, height } }`
- **Behavior**: aggregates total sleep duration per day (using `record.end` to pick the day) and maps durations to a `height` scaled into `[0, maxHeight]` using `rangeLerp`.
- **Returns**: object keyed by ISO dates with human readable duration and scaled height.

### `_timeMean(epochSecs) -> { concentration, meanSeconds, meanTime }` (internal)
- Computes the circular mean (useful for clock-time averages) — returns vector concentration `R` (how concentrated times are), mean in seconds, and a formatted `HH:mm:ss` time.

### `getAverages(input) -> { start, end, duration }`
- **Behavior**: returns mean start time, mean end time (both circular means), and mean duration across records.
- **Return shape**:
  - `start` and `end`: `{ concentration, meanSeconds, meanTime }`
  - `duration`: `{ meanSeconds, meanTime }`

### `getIntervalTimeline(input, { lat, lon, startPaddingDuration = 12h, endPaddingDuration = 12h, width = 100 }) -> Object`
- **Behavior**:
  - Computes a timeline across records with left/right position shifts relative to the first/last record.
  - Fetches `sunTimes` (via `sunTimes.requestList`) for the extended range.
- **Returns**: `{ rangeStart, rangeEnd, sleepSessions, sunTimes, leftTimeShifts, leftWidthShifts, rightTimeShifts, rightWidthShifts }` — useful to draw a visual timeline.

### `getSplitIntervals(input, { splitDuration = 1 day, offsetDuration = 0, lat, lon }) -> splitIntervals[]`
- **Behavior**:
  - Splits the global range into contiguous intervals of length `splitDuration` (optionally offset), assigns each sleep session to every interval it overlaps, and packs corresponding `sunTimes` per interval.
- **Returns**: array of intervals:
  ```js
  [{ intervalStart, intervalEnd, sleepSessions: [...], sunTimes: [...] }, ...]
  ```
- **Notes**: `offsetDuration` must be <= `splitDuration`.

---

## Import / Export

### `exportToObject() -> { meta, sleepSessions, sunTimes }`
- Returns a plain object ready to be JSON-stringified.

### `exportToURL() -> { url, revoke() }`
- Creates a `Blob` and returns an object with `url` (object URL) and `revoke()` to free it.

### `importFromObject(dataObj, clearExisting = false)`
- **Inputs**: `dataObj` must be `{ sleepSessions: [], sunTimes: [] }`.
- **Behavior**:
  - If `clearExisting` is `true` both stores are cleared first.
  - Inserts sessions that do not already exist (by `id`) and then inserts/overwrites sunTimes.
  - Updates `logic.sessionCount` to the new DB count.
- **Errors**: throws if the passed object is malformed.

---

## Utility helpers

- `StoredValue` — simple persistent wrapper around localStorage (see section above).
- `rangeLerp({ inputValue, inputRangeStart = 0, inputRangeEnd = 1, outputRangeStart, outputRangeEnd, capInput = false, decimalPlaces = null })` — linear interpolation helper.
- `uuid()` — random UUID generator (uses `crypto.randomUUID()` when available).
- `toEpochSec(value)` — converts numbers, Date, Luxon DateTime, or strings (ISO/RFC) to seconds (integer) or returns `null`.
- `fromEpochSec(epochSec)` — returns Luxon DateTime from epoch seconds.
- `toISODate(epochSec)` — returns ISO date `YYYY-MM-DD` for a DateTime/epoch input.
- `roundLatLon(input)` — round a lat/lon to two decimals.

---

## Errors, edge-cases & notes

- Many functions throw `Error(...)` when required parameters are missing or invalid. Callers should catch these.
- `sleepSession.list()` uses `byEnd` index and starts cursor at `lowerBound(rangeStart)` — it will *iterate forward* and include any session with `start <= rangeEnd`. This ensures sessions that **partially overlap** are included.
- `sleepSession.start()` stores start as ISO inside `logic.currentSession`; `sleepSession.stop()` validates that `end >= start`. If you rely on `currentSession` from outside, remember it contains ISO strings and optional `lat`/`lon`.
- Lat/lon are rounded to 2 decimals (approx 1km precision) — this is intentional to reduce cached sunTimes duplication. If you need higher precision change `roundLatLon`.
- `sunTimes.requestList()` will attempt to fetch missing days and cache them. It will respect `CONCURRENCY_LIMIT` and `CONCURRENCY_DELAY_MS`.