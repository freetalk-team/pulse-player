CREATE TABLE IF NOT EXISTS playlist (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	icon TEXT DEFAULT 'fa-list-ul',
	genre TEXT DEFAULT 'Various',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	played_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_playlist_id ON playlist(id);
CREATE INDEX IF NOT EXISTS idx_playlist_created ON playlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlist_recent ON playlist(played_at DESC) WHERE played_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS playlist_track (
	playlist_id INTEGER,
	track_id INTEGER,
	position INTEGER,
	UNIQUE(playlist_id, track_id),
	PRIMARY KEY (playlist_id, track_id),
	FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE CASCADE,
	FOREIGN KEY (track_id) REFERENCES track(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pt_playlist ON playlist_track(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_pt_track ON playlist_track(track_id);

CREATE VIEW IF NOT EXISTS playlist_stat AS
SELECT 
	p.*, 
	COUNT(pt.track_id) as track_count, 
	IFNULL(SUM(t.rating), 0) as total_rating,
	IFNULL(SUM(t.duration), 0) as total_duration,
	SUM(t.size) as total_size,
	MAX(t.played_at) as last_played_at
FROM playlist p
LEFT JOIN playlist_track pt ON p.id = pt.playlist_id
LEFT JOIN tracks t ON pt.track_id = t.id
GROUP BY p.id;

CREATE VIEW IF NOT EXISTS playlist_thumbs AS
WITH RankedTracks AS (
	SELECT 
		pt.playlist_id,
		t.thumb_path AS thumb,
		ROW_NUMBER() OVER (
			PARTITION BY pt.playlist_id 
			ORDER BY 
				t.thumb_path IS NULL,
				t.rating DESC, 
				pt.position ASC
		) AS rank
		-- WHERE t.rating > 0 OR pt.position <= 50
	FROM playlist_track pt
	JOIN tracks t ON pt.track_id = t.id
)
SELECT 
	playlist_id AS id,
	GROUP_CONCAT(thumb, ',') AS thumbs
FROM (
	SELECT playlist_id, thumb
	FROM RankedTracks
	WHERE rank <= 4
	ORDER BY playlist_id, rank
)
GROUP BY playlist_id;

CREATE VIEW IF NOT EXISTS playlists AS
SELECT 
	p.*,
	'playlist' as type,
	ps.track_count,
	ps.total_rating,
	ps.total_duration,
	ps.total_size,
	ps.last_played_at,
	pt.thumbs AS cover_path
FROM playlist p
LEFT JOIN playlist_stat ps ON p.id = ps.id
LEFT JOIN playlist_thumbs pt ON p.id = pt.id;

CREATE VIEW IF NOT EXISTS playlist_tracks AS 
SELECT
	t.*,
	pt.playlist_id,
	pt.position
FROM playlist_track pt
LEFT JOIN tracks t on pt.track_id=t.id;
