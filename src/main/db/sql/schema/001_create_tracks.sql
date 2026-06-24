CREATE TABLE IF NOT EXISTS tracks (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT,
	artist TEXT,
	genre TEXT,
	path TEXT UNIQUE,
	duration INTEGER DEFAULT 0,
	rating INTEGER DEFAULT 0,
	type TEXT CHECK( type IN ('audio', 'video') ) DEFAULT 'audio',
	thumb_path TEXT,
	tag TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	played_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_tracks_id ON tracks(id);
CREATE INDEX IF NOT EXISTS idx_tracks_rating ON tracks(rating DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_created ON tracks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_recent ON tracks(played_at DESC) WHERE played_at IS NOT NULL;

-- 2. FTS5 Virtual Table for Searching
-- We don't store duration/path here, only searchable text
CREATE VIRTUAL TABLE IF NOT EXISTS tracks_search USING fts5(
	title, 
	artist, 
	album,
	genre,
	track_id UNINDEXED
);

-- 1. Trigger for New Inserts
CREATE TRIGGER IF NOT EXISTS tracks_after_insert
AFTER INSERT ON tracks
BEGIN
	INSERT INTO tracks_search (title, artist, genre, track_id)
	VALUES (new.title, new.artist, new.genre, new.id);
END;

-- 2. Trigger for Deletions (keeps the index small)
CREATE TRIGGER IF NOT EXISTS tracks_after_delete
AFTER DELETE ON tracks
BEGIN
	DELETE FROM tracks_search WHERE track_id = old.id;
END;

-- 3. Trigger for Updates (if you edit metadata later)
CREATE TRIGGER IF NOT EXISTS tracks_after_update
AFTER UPDATE ON tracks
BEGIN
	UPDATE tracks_search 
	SET title = new.title, artist = new.artist, genre = new.genre
	WHERE track_id = new.id;
END;