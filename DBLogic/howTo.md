Logic._initDB() // initialise DB, called in constructor

// Vars
Logic.lastSessionID // stores the ID of the latest sleepSession recorded (maybe StoredValue)
Logic.sessionCount // stores number sleepSessions recorded (maybe StoredValue)
Logic.currentSessionStart // stores timestamp last recorded by Logic.sleepSession.start() (StoredValue)

// Sleep CRUD
Logic.sleepSession.create({ start, end, lat, lon }) -> record
Logic.sleepSession.get(id) -> record
Logic.sleepSession.update({ id, start, end, lat, lon }) -> record
Logic.sleepSession.delete(id) -> bool

// Main
Logic.sleepSession.start() // edits Logic.currentSessionStart
Logic.sleepSession.stop() // ends session started by Logic.currentSessionStart and creates it in DB
Logic.sleepSession.list({ start, end }) -> records // gives all pairs that are either partially or completely in range of the start and end

// Sun CRUD
Logic.sunTimes.put({ date, lat, lon, sunrise, sunset }) -> record
Logic.sunTimes.get({ date, lat, lon }) -> record

// Stats
Logic.statistics.getGraph(data)
Logic.statistics.getAverages()
...


// Import / Export
Logic.exportToObject() -> Object
Logic.exportToURL() -> URL
Logic.importFromObject({ Object, overwriteSessions, mergeSun })

// Helpers
StoredValue // keeps variables persistent in localStorage
rangeLerp
uuid // generates UUIDS
toEpochSec
fromEpochSec
