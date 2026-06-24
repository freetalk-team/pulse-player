CREATE TABLE IF NOT EXISTS playlists (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT UNIQUE NOT NULL,
	icon TEXT DEFAULT 'fa-list-ul',
	icon_color TEXT,
	genre TEXT DEFAULT 'Various',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	played_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_playlists_id ON playlists(id);
CREATE INDEX IF NOT EXISTS idx_playlists_created ON playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_recent ON playlists(played_at DESC) WHERE played_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS playlist_tracks (
	playlist_id INTEGER,
	track_id INTEGER,
	position INTEGER,
	UNIQUE(playlist_id, track_id),
	PRIMARY KEY (playlist_id, track_id),
	FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
	FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pt_playlist ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_pt_track ON playlist_tracks(track_id);

CREATE VIEW IF NOT EXISTS playlist_stat AS
SELECT 
	p.*, 
	COUNT(pt.track_id) as track_count, 
	IFNULL(SUM(t.rating), 0) as total_rating,
	IFNULL(SUM(t.duration), 0) as total_duration,
	MAX(t.played_at) as last_played_at
FROM playlists p
LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
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
	FROM playlist_tracks pt
	JOIN track t ON pt.track_id = t.id
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

CREATE VIEW IF NOT EXISTS playlist AS
SELECT 
	p.*,
	ps.track_count,
	ps.total_rating,
	ps.total_duration,
	ps.last_played_at,
	pt.thumbs AS cover_path
FROM playlists p
LEFT JOIN playlist_stat ps ON p.id = ps.id
LEFT JOIN playlist_thumbs pt ON p.id = pt.id;

CREATE VIEW IF NOT EXISTS playlist_track AS 
SELECT
	t.*,
	pt.playlist_id,
	pt.position
FROM playlist_tracks pt
LEFT JOIN track t on pt.track_id=t.id;
