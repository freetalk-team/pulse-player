CREATE TABLE IF NOT EXISTS track (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	hash TEXT UNIQUE,
	title TEXT,
	artist TEXT,
	album TEXT,
	album_id INTEGER,
	genre TEXT,
	path TEXT UNIQUE,
	duration INTEGER DEFAULT 0,
	type TEXT CHECK( type IN ('audio', 'video') ) DEFAULT 'audio',
	thumb_path TEXT,
	size INTEGER,
	tag TEXT
);

-- CREATE INDEX IF NOT EXISTS idx_track_album_id ON track(album_id);
CREATE INDEX IF NOT EXISTS idx_track_hash ON track(hash);


CREATE TABLE IF NOT EXISTS track_stat (
	id INTEGER PRIMARY KEY,
	rating INTEGER DEFAULT 0,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME,
	played_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_track_stat_rating ON track_stat(rating DESC);
CREATE INDEX IF NOT EXISTS idx_track_stat_created ON track_stat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_track_stat_recent ON track_stat(played_at DESC) WHERE played_at IS NOT NULL;

CREATE TRIGGER IF NOT EXISTS track_after_insert
AFTER INSERT ON track
BEGIN
	INSERT INTO track_stat (id)
	VALUES (new.id);
END;

CREATE TRIGGER IF NOT EXISTS track_after_delete
AFTER DELETE ON track
BEGIN
	DELETE FROM track_stat WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS track_after_update
AFTER UPDATE ON track
FOR EACH ROW
BEGIN
    UPDATE track_stat
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;


-- 2. FTS5 Virtual Table for Searching
-- We don't store duration/path here, only searchable text
CREATE VIRTUAL TABLE IF NOT EXISTS tracks_search USING fts5(
	title, 
	artist, 
	album,
	genre
);

-- CREATE VIRTUAL TABLE tracks_search USING fts5(
--     title,
--     artist,
--     album,
--     genre,
--     content='track',
--     content_rowid='id'
-- );

-- INSERT INTO tracks_search(tracks_search) VALUES('rebuild');

-- 1. Trigger for New Inserts
CREATE TRIGGER IF NOT EXISTS track_search_after_insert
AFTER INSERT ON track
BEGIN
	INSERT INTO tracks_search (rowid, title, artist, album, genre)
	VALUES (new.id, new.title, new.artist, new.album, new.genre);
END;

-- 2. Trigger for Deletions (keeps the index small)

CREATE TRIGGER IF NOT EXISTS track_search_after_delete 
AFTER DELETE ON track 
BEGIN
	DELETE FROM tracks_search WHERE rowid = old.id;
END;

CREATE TRIGGER IF NOT EXISTS track_search_after_update
AFTER UPDATE OF title, artist, album, genre ON track 
BEGIN
	DELETE FROM tracks_search WHERE rowid = old.id;

  	INSERT INTO tracks_search(rowid, title, artist, album, genre)
  	VALUES (new.id, new.title, new.artist, new.album, new.genre);
END;