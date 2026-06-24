CREATE TABLE IF NOT EXISTS albums (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT,
	artist TEXT,
	genre TEXT,
	cover_path TEXT,
	year INTEGER,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	played_at DATETIME,
	UNIQUE(name, artist)
);

CREATE INDEX IF NOT EXISTS idx_albums_id ON albums(id);
CREATE INDEX IF NOT EXISTS idx_albums_created ON albums(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_recent ON albums(played_at DESC) WHERE played_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS album_tracks (
	album_id INTEGER,
	track_id INTEGER,
	position INTEGER,
	UNIQUE(album_id, track_id),
	PRIMARY KEY (album_id, track_id),
	FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
	FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_at_album ON album_tracks(album_id, position);
CREATE INDEX IF NOT EXISTS idx_at_track ON album_tracks(track_id);

CREATE TRIGGER IF NOT EXISTS album_tracks_after_insert
AFTER INSERT ON album_tracks
BEGIN
	UPDATE tracks_search
	SET (album,genre) = (SELECT name,genre FROM albums WHERE id = new.album_id) 
	WHERE track_id = new.track_id;
END;

CREATE VIEW IF NOT EXISTS album_track AS 
SELECT
	at.album_id,
	at.track_id as id,
	at.position,
	t.title,
	t.artist,
	t.rating,
	t.duration,
	t.path,
	t.type,
	t.thumb_path,
	t.played_at,
	a.name as album,
	a.genre,
	a.year,
	a.cover_path
FROM album_tracks at
LEFT JOIN albums a ON at.album_id=a.id
LEFT JOIN tracks t on at.track_id=t.id;

CREATE VIEW IF NOT EXISTS track AS
SELECT DISTINCT
	t.id,
	t.title,
	t.artist,
	COALESCE(t.genre, a.genre) as genre,
	a.album,
	a.year,
	t.rating,
	t.duration,
	t.type,
	t.created_at,
	t.played_at,
	t.path,
	COALESCE(t.thumb_path, a.cover_path) as thumb_path,
	t.tag
FROM tracks t
LEFT JOIN album_track a ON t.id=a.id
GROUP BY t.id;

-- CREATE VIEW IF NOT EXISTS album AS 
-- SELECT 
-- 	a.*,
-- 	COUNT(t.id) as track_count,
-- 	IFNULL(SUM(t.rating), 0) as total_rating,
-- 	IFNULL(SUM(t.duration), 0) as total_duration,
-- 	MAX(t.played_at) as last_played_at
-- FROM albums a 
-- LEFT JOIN album_track t ON a.id=t.album_id
-- GROUP BY a.id;

CREATE VIEW IF NOT EXISTS album AS 
SELECT 
	a.*,
	COUNT(t.id) as track_count,
	IFNULL(SUM(t.rating), 0) as total_rating,
	IFNULL(SUM(t.duration), 0) as total_duration,
	MAX(t.played_at) as last_played_at
FROM albums a 
LEFT JOIN album_track t ON a.id = t.album_id
GROUP BY a.id
HAVING COUNT(t.id) > 2;