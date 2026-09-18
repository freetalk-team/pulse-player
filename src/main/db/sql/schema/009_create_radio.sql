
CREATE TABLE IF NOT EXISTS station (
    id INTEGER PRIMARY KEY,
    uuid TEXT UNIQUE,
    changeid INTEGER,
    name TEXT,
    url TEXT,
    homepage TEXT,
    favicon TEXT,
    country TEXT,
    countrycode TEXT,
    state TEXT,
    language TEXT,
    tags TEXT,
    codec TEXT,
    timezone TEXT DEFAULT 'UTC',
    favourite BOOLEAN DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_station_changeid ON station(changeid);
CREATE INDEX IF NOT EXISTS idx_station_uuid ON station(uuid);

CREATE TABLE IF NOT EXISTS station_stat (
	id INTEGER PRIMARY KEY,
	rating INTEGER DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME,
	played_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_station_stat_rating ON station_stat(rating DESC);
CREATE INDEX IF NOT EXISTS idx_station_stat_created ON station_stat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_station_stat_recent ON station_stat(played_at DESC) WHERE played_at IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS station_after_insert
AFTER INSERT ON station
BEGIN
	INSERT INTO station_stat (id)
	VALUES (new.id);
END;

CREATE TRIGGER IF NOT EXISTS station_after_delete
AFTER DELETE ON station
BEGIN
	DELETE FROM station_stat WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS station_after_update
AFTER UPDATE ON station
FOR EACH ROW
BEGIN
    UPDATE station_stat
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE VIEW IF NOT EXISTS stations AS
SELECT 
	t.*,
	ts.rating,
	ts.created_at,
	ts.updated_at,
	ts.played_at
FROM station t
LEFT JOIN station_stat ts ON ts.id = t.id;


-- 2. FTS5 Virtual Table for Searching
-- We don't store duration/path here, only searchable text
CREATE VIRTUAL TABLE IF NOT EXISTS stations_search USING fts5(
	name, 
	tags,
	country,
    language 
);

CREATE TRIGGER IF NOT EXISTS station_search_after_insert
AFTER INSERT ON station
BEGIN
	INSERT INTO stations_search (rowid, name, tags, country, language)
	VALUES (
        new.id, 
        new.name, 
        new.tags, 
        new.countrycode ||
            CASE
                WHEN new.country IS NOT NULL THEN ' ' || new.country
                ELSE ''
            END, 
        new.language);
END;

CREATE TRIGGER IF NOT EXISTS station_search_after_delete 
AFTER DELETE ON station 
BEGIN
	DELETE FROM stations_search WHERE rowid = old.id;
END;

-- CREATE TRIGGER IF NOT EXISTS station_search_after_update
-- AFTER UPDATE ON station 
-- BEGIN
-- 	DELETE FROM stations_search WHERE rowid = old.id;

--   	INSERT INTO stations_search(rowid, name, country, country_code, state)
--   	VALUES (new.id, new.name, new.country, new.country_code, new.state);
-- END;

CREATE TABLE IF NOT EXISTS station_search_cache (
    query TEXT PRIMARY KEY,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- last_updated INTEGER DEFAULT (unixepoch())
    offset INTEGER DEFAULT 0,
    more BOOLEAN DEFAULT 1
);

-- 1. Schedule Configuration Table
CREATE TABLE IF NOT EXISTS recording (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL,             -- Links to station.uuid
    title TEXT NOT NULL,            -- User-defined name for the task
    artist TEXT DEFAULT 'Unknown',  -- Target artist or show sub-tag
    start_time TEXT NOT NULL,       -- Stored as HH:MM format in UTC
    end_time TEXT NOT NULL,         -- Stored as HH:MM format in UTC
    repeat TEXT NOT NULL,           -- 'None', 'Daily', 'Weekly'
    is_active BOOLEAN DEFAULT 1,    -- Master switch (User toggle)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES station(id) ON DELETE CASCADE
);

-- 2. Performance Indexes (Ensures fast polling lookups every 60 seconds)
CREATE INDEX IF NOT EXISTS idx_active_schedule 
ON recording (is_active, start_time, end_time);

CREATE VIEW IF NOT EXISTS recordings AS
SELECT * FROM recording 
WHERE repeat != 'None' OR start_time > datetime()
ORDER BY start_time ASC;

CREATE VIEW IF NOT EXISTS station_recordings AS
SELECT 
    r.*,
    s.name as station_name,
    s.favicon,
    s.countrycode,
    s.timezone,
    s.favourite
FROM recordings r
LEFT JOIN station s ON r.station_id = s.id;