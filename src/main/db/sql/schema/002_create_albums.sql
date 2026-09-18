CREATE TABLE IF NOT EXISTS album (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT,
	artist TEXT,
	genre TEXT,
	cover_path TEXT,
	year INTEGER,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	played_at DATETIME,
	UNIQUE(name, artist, year)
);

INSERT INTO sqlite_sequence (name, seq) VALUES('album', 200000);

-- CREATE INDEX IF NOT EXISTS idx_album_id ON album(id);
CREATE INDEX IF NOT EXISTS idx_album_created ON album(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_album_recent ON album(played_at DESC) WHERE played_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS album_track (
	album_id INTEGER,
	track_id INTEGER,
	position INTEGER,
	UNIQUE(album_id, track_id),
	PRIMARY KEY (album_id, track_id),
	FOREIGN KEY (album_id) REFERENCES album(id) ON DELETE CASCADE,
	FOREIGN KEY (track_id) REFERENCES track(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_at_album ON album_track(album_id, position);
CREATE INDEX IF NOT EXISTS idx_at_track ON album_track(track_id);

-- CREATE TRIGGER IF NOT EXISTS album_tracks_after_insert
-- AFTER INSERT ON album_track
-- BEGIN
-- 	UPDATE track_search
-- 	SET (album, genre) = (SELECT name, genre FROM albums WHERE id = new.album_id) 
-- 	WHERE track_id = new.track_id;
-- END;

CREATE VIEW IF NOT EXISTS tracks AS
SELECT 
	t.id,
	t.hash,
	t.title,
	t.artist,
	t.album,
	COALESCE(t.genre, a.genre) AS genre,
	t.duration,
	t.path,
	t.type,
	COALESCE(t.thumb_path, a.cover_path) AS thumb_path,
	t.size,
	t.tag,
	ts.rating,
	ts.created_at,
	ts.updated_at,
	ts.played_at
FROM track t
LEFT JOIN track_stat ts ON ts.id = t.id
LEFT JOIN album a ON a.id=t.album_id;

CREATE VIEW IF NOT EXISTS album_tracks AS 
SELECT
	t.*,
	at.position,
	at.album_id,
	a.year
FROM album_track at
LEFT JOIN album a ON at.album_id=a.id
LEFT JOIN tracks t on at.track_id=t.id;

CREATE VIEW IF NOT EXISTS albums AS 
SELECT 
	a.*,
	'album' as type,
	COUNT(t.id) as track_count,
	IFNULL(SUM(t.rating), 0) as total_rating,
	IFNULL(SUM(t.duration), 0) as total_duration,
	SUM(t.size) as total_size,
	MAX(t.played_at) as last_played_at
FROM album a 
LEFT JOIN album_tracks t ON a.id = t.album_id
GROUP BY a.id
HAVING COUNT(t.id) > 2;

