
import createTracksSQL from './sql/schema/001_create_tracks.sql?raw';
import createAlbumsSQL from './sql/schema/002_create_albums.sql?raw';
import createPlaylistsSQL from './sql/schema/003_create_playlists.sql?raw';
import createPlaysetsSQL from './sql/schema/004_create_playsets.sql?raw';
import createSetsSQL from './sql/schema/005_create_sets.sql?raw';
import createComponentsSQL from './sql/schema/006_create_components.sql?raw';
import createRequestsSQL from './sql/schema/007_create_requests.sql?raw';
import createPostsSQL from './sql/schema/008_create_posts.sql?raw';

import { runMigrations } from './migrate';

export function setup(db) {

	db.exec(createTracksSQL);
	db.exec(createAlbumsSQL);
	db.exec(createPlaylistsSQL);
	db.exec(createPlaysetsSQL);
	db.exec(createSetsSQL);
	db.exec(createComponentsSQL);
    db.exec(createRequestsSQL);
    db.exec(createPostsSQL);

	enableOptimizations(db);

	runMigrations(db);
}

function enableOptimizations(db) {
	db.exec(`
		PRAGMA journal_mode = WAL;
		PRAGMA synchronous = NORMAL;
		PRAGMA temp_store = MEMORY;
		PRAGMA foreign_keys = ON;
	`);
}

/*

# Better approach

CREATE TABLE tracks (
	id INTEGER PRIMARY KEY,
	album_id INTEGER,
	path TEXT UNIQUE NOT NULL,
	title TEXT,
	track_no INTEGER,
	duration INTEGER DEFAULT 0,
	rating INTEGER DEFAULT 0,
	type TEXT CHECK(type IN ('audio','video')),
	thumb_path TEXT,
	created_at INTEGER DEFAULT (unixepoch()),
	played_at INTEGER,
	FOREIGN KEY(album_id) REFERENCES albums(id)
);


CREATE INDEX idx_tracks_album_track
ON tracks(album_id, track_no);

CREATE INDEX idx_tracks_created
ON tracks(created_at DESC);

CREATE INDEX idx_tracks_recent
ON tracks(played_at DESC)
WHERE played_at IS NOT NULL;


# If table exists we need a trigger 
CREATE TRIGGER set_tracks_created_at
	AFTER INSERT ON tracks
	FOR EACH ROW
	WHEN NEW.created_at IS NULL
	BEGIN
		UPDATE tracks
		SET created_at = CURRENT_TIMESTAMP
		WHERE id = NEW.id;
	END;

CREATE TRIGGER set_albums_created_at
	AFTER INSERT ON albums
	FOR EACH ROW
	WHEN NEW.created_at IS NULL
	BEGIN
		UPDATE tracks
		SET created_at = CURRENT_TIMESTAMP
		WHERE id = NEW.id;
	END;

CREATE VIEW playlist_with_thumbs AS
WITH RankedTracks AS (
    SELECT 
        pt.playlist_id,
        COALESCE(t.thumb_path, a.cover_path) AS thumb,
        ROW_NUMBER() OVER (
            PARTITION BY pt.playlist_id 
            ORDER BY t.rating DESC, pt.position ASC
        ) AS rank
    FROM playlist_tracks pt
    JOIN tracks t ON pt.track_id = t.id
    LEFT JOIN albums a ON t.album_id = a.id
),
Thumbs AS (
    SELECT 
        playlist_id,
        GROUP_CONCAT(thumb, ',') AS thumbs
    FROM RankedTracks
    WHERE rank <= 4
    GROUP BY playlist_id
)
SELECT 
    p.*,
    t.thumbs
FROM playlists p
LEFT JOIN Thumbs t ON p.id = t.playlist_id;

-- 4 thumbs per playset
CREATE VIEW IF NOT EXISTS playset AS
WITH RECURSIVE PlaylistThumbs AS (
	-- Split playlist thumbs into rows
	SELECT 
		p.id AS playlist_id,
		substr(p.thumbs, 1, instr(p.thumbs || ',', ',') - 1) AS thumb,
		substr(p.thumbs || ',', instr(p.thumbs || ',', ',') + 1) AS rest
	FROM playlist p
	WHERE p.thumbs IS NOT NULL

	UNION ALL

	SELECT 
		playlist_id,
		substr(rest, 1, instr(rest, ',') - 1),
		substr(rest, instr(rest, ',') + 1)
	FROM PlaylistThumbs
	WHERE rest != ''
),

AllThumbSources AS (
	-- Thumbs from playlists
	SELECT 
		pm.playset_id,
		pt.thumb,
		pm.position
	FROM playset_members pm
	JOIN PlaylistThumbs pt 
		ON pm.member_id = pt.playlist_id
	WHERE pm.member_type = 'playlist'

	UNION ALL

	-- Thumbs from albums
	SELECT 
		pm.playset_id,
		a.cover_path AS thumb,
		pm.position
	FROM playset_members pm
	JOIN albums a 
		ON pm.member_id = a.id
	WHERE pm.member_type = 'album'
),

RankedThumbs AS (
	SELECT 
		playset_id,
		thumb,
		ROW_NUMBER() OVER (
			PARTITION BY playset_id
			ORDER BY 
				position ASC,
				(thumb IS NULL)  -- push NULLs last
		) AS rank
	FROM AllThumbSources
	WHERE thumb IS NOT NULL
),

Thumbs AS (
	SELECT 
		playset_id,
		GROUP_CONCAT(thumb, ',') AS thumbs
	FROM (
		SELECT playset_id, thumb
		FROM RankedThumbs
		WHERE rank <= 4
		ORDER BY playset_id, rank
	)
	GROUP BY playset_id
)

SELECT 
	ps.*,

	COUNT(pm.id) AS member_count,

	IFNULL(SUM(CASE 
		WHEN pm.member_type = 'playlist' THEN v_p.total_rating 
		WHEN pm.member_type = 'album' THEN v_a.total_rating 
	END), 0) AS total_rating,

	IFNULL(SUM(CASE 
		WHEN pm.member_type = 'playlist' THEN v_p.total_duration 
		WHEN pm.member_type = 'album' THEN v_a.total_duration
	END), 0) AS total_duration,
	
	IFNULL(SUM(CASE 
		WHEN pm.member_type = 'playlist' THEN v_p.track_count 
		WHEN pm.member_type = 'album' THEN v_a.track_count 
	END), 0) AS track_count,

	MAX(CASE 
		WHEN pm.member_type = 'playlist' THEN v_p.last_played_at
		WHEN pm.member_type = 'album' THEN v_a.played_at
	END) AS last_played_at,

	th.thumbs

FROM playsets ps
LEFT JOIN playset_members pm 
	ON ps.id = pm.playset_id

LEFT JOIN playlist v_p 
	ON pm.member_id = v_p.id 
	AND pm.member_type = 'playlist'

LEFT JOIN album v_a 
	ON pm.member_id = v_a.id 
	AND pm.member_type = 'album'

LEFT JOIN Thumbs th 
	ON ps.id = th.playset_id

GROUP BY ps.id;


CREATE VIEW playlist_full AS
WITH TrackStats AS (
    SELECT 
        p.id AS playlist_id,
        COUNT(pt.track_id) AS track_count,
        IFNULL(SUM(t.rating), 0) AS total_rating,
        IFNULL(SUM(t.duration), 0) AS total_duration,
        MAX(t.played_at) AS last_played_at
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
    LEFT JOIN tracks t ON pt.track_id = t.id
    GROUP BY p.id
),

RankedTracks AS (
    SELECT 
        pt.playlist_id,
        COALESCE(t.thumb_path, a.cover_path) AS thumb,
        ROW_NUMBER() OVER (
            PARTITION BY pt.playlist_id 
            ORDER BY t.rating DESC, pt.position ASC
        ) AS rank
    FROM playlist_tracks pt
    JOIN tracks t ON pt.track_id = t.id
    LEFT JOIN albums a ON t.album_id = a.id
),

Thumbs AS (
    SELECT 
        playlist_id,
        GROUP_CONCAT(thumb, ',') AS thumbs
    FROM (
        SELECT playlist_id, thumb
        FROM RankedTracks
        WHERE rank <= 4
        ORDER BY playlist_id, rank
    )
    GROUP BY playlist_id
)

SELECT 
    p.*,
    ts.track_count,
    ts.total_rating,
    ts.total_duration,
    ts.last_played_at,
    th.thumbs
FROM playlists p
LEFT JOIN TrackStats ts ON p.id = ts.playlist_id
LEFT JOIN Thumbs th ON p.id = th.playlist_id;

CREATE VIEW IF NOT EXISTS playset AS
		SELECT 
			ps.*,
			COUNT(pm.id) as member_count,
	   
			SUM(CASE 
				WHEN pm.member_type = 'playlist' THEN v_p.total_rating 
				WHEN pm.member_type = 'album' THEN v_a.total_rating 
			END) as total_rating,

			SUM(CASE 
				WHEN pm.member_type = 'playlist' THEN v_p.total_duration 
				WHEN pm.member_type = 'album' THEN v_a.total_duration
			END) as total_duration,
			
			SUM(CASE 
				WHEN pm.member_type = 'playlist' THEN v_p.track_count 
				WHEN pm.member_type = 'album' THEN v_a.track_count 
			END) as track_count
		FROM playsets ps
		LEFT JOIN playset_members pm ON ps.id = pm.playset_id
		LEFT JOIN playlist v_p ON (pm.member_id = v_p.id AND pm.member_type = 'playlist')
		LEFT JOIN album v_a ON (pm.member_id = v_a.id AND pm.member_type = 'album')
		GROUP BY ps.id;

CREATE VIEW IF NOT EXISTS playset_full AS
WITH RECURSIVE PlaylistThumbs AS (
    -- Split playlist thumbs into rows
    SELECT 
        p.id AS playlist_id,
        substr(p.thumbs, 1, instr(p.thumbs || ',', ',') - 1) AS thumb,
        substr(p.thumbs || ',', instr(p.thumbs || ',', ',') + 1) AS rest
    FROM playlist_with_thumbs p
    WHERE p.thumbs IS NOT NULL

    UNION ALL

    SELECT 
        playlist_id,
        substr(rest, 1, instr(rest, ',') - 1),
        substr(rest, instr(rest, ',') + 1)
    FROM PlaylistThumbs
    WHERE rest != ''
),

AllThumbSources AS (
    -- Thumbs from playlists
    SELECT 
        pm.playset_id,
        pt.thumb,
        pm.position
    FROM playset_members pm
    JOIN PlaylistThumbs pt 
        ON pm.member_id = pt.playlist_id
    WHERE pm.member_type = 'playlist'

    UNION ALL

    -- Thumbs from albums
    SELECT 
        pm.playset_id,
        a.cover_path AS thumb,
        pm.position
    FROM playset_members pm
    JOIN albums a 
        ON pm.member_id = a.id
    WHERE pm.member_type = 'album'
),

RankedThumbs AS (
    SELECT 
        playset_id,
        thumb,
        ROW_NUMBER() OVER (
            PARTITION BY playset_id
            ORDER BY 
                position ASC,
                (thumb IS NULL)  -- push NULLs last
        ) AS rank
    FROM AllThumbSources
    WHERE thumb IS NOT NULL
),

Thumbs AS (
    SELECT 
        playset_id,
        GROUP_CONCAT(thumb, ',') AS thumbs
    FROM (
        SELECT playset_id, thumb
        FROM RankedThumbs
        WHERE rank <= 4
        ORDER BY playset_id, rank
    )
    GROUP BY playset_id
)

SELECT 
    ps.*,

    COUNT(pm.id) AS member_count,

    IFNULL(SUM(CASE 
        WHEN pm.member_type = 'playlist' THEN v_p.total_rating 
        WHEN pm.member_type = 'album' THEN v_a.total_rating 
    END), 0) AS total_rating,

    IFNULL(SUM(CASE 
        WHEN pm.member_type = 'playlist' THEN v_p.total_duration 
        WHEN pm.member_type = 'album' THEN v_a.total_duration
    END), 0) AS total_duration,
    
    IFNULL(SUM(CASE 
        WHEN pm.member_type = 'playlist' THEN v_p.track_count 
        WHEN pm.member_type = 'album' THEN v_a.track_count 
    END), 0) AS track_count,

    MAX(CASE 
        WHEN pm.member_type = 'playlist' THEN v_p.last_played_at
        WHEN pm.member_type = 'album' THEN v_a.played_at
    END) AS last_played_at,

    th.thumbs

FROM playsets ps
LEFT JOIN playset_members pm 
    ON ps.id = pm.playset_id

LEFT JOIN playlist_with_thumbs v_p 
    ON pm.member_id = v_p.id 
    AND pm.member_type = 'playlist'

LEFT JOIN albums v_a 
    ON pm.member_id = v_a.id 
    AND pm.member_type = 'album'

LEFT JOIN Thumbs th 
    ON ps.id = th.playset_id

GROUP BY ps.id;

# Improve performance for large tables

CREATE TABLE playlist_stats (
    playlist_id INTEGER PRIMARY KEY,
    track_count INTEGER,
    total_rating INTEGER,
    total_duration INTEGER,
    last_played_at DATETIME
);

CREATE TRIGGER update_playlist_stats_after_insert
AFTER INSERT ON playlist_tracks
BEGIN
    UPDATE playlist_stats
    SET track_count = track_count + 1
    WHERE playlist_id = NEW.playlist_id;
END;

CREATE VIEW playlist_stats_view AS
SELECT 
    p.id,
    COUNT(pt.track_id) AS track_count,
    IFNULL(SUM(t.rating), 0) AS total_rating,
    IFNULL(SUM(t.duration), 0) AS total_duration,
    MAX(t.played_at) AS last_played_at
FROM playlists p
LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
LEFT JOIN tracks t ON pt.track_id = t.id
GROUP BY p.id;

CREATE TABLE playlist_cache (
    playlist_id INTEGER PRIMARY KEY,
    track_count INTEGER,
    total_rating INTEGER,
    total_duration INTEGER,
    last_played_at DATETIME,
    thumbs TEXT
);

SELECT p.*, c.*
FROM playlists p
LEFT JOIN playlist_cache c ON p.id = c.playlist_id;

INSERT INTO playlist_cache (
    playlist_id,
    track_count,
    total_rating,
    total_duration,
    last_played_at,
    thumbs
)
WITH TrackStats AS (
    SELECT 
        p.id AS playlist_id,
        COUNT(pt.track_id) AS track_count,
        IFNULL(SUM(t.rating), 0) AS total_rating,
        IFNULL(SUM(t.duration), 0) AS total_duration,
        MAX(t.played_at) AS last_played_at
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
    LEFT JOIN tracks t ON pt.track_id = t.id
    GROUP BY p.id
),

RankedTracks AS (
    SELECT 
        pt.playlist_id,
        COALESCE(t.thumb_path, a.cover_path) AS thumb,
        ROW_NUMBER() OVER (
            PARTITION BY pt.playlist_id 
            ORDER BY 
                (t.thumb_path IS NULL AND a.cover_path IS NULL),
                t.rating DESC,
                pt.position ASC
        ) AS rank
    FROM playlist_tracks pt
    JOIN tracks t ON pt.track_id = t.id
    LEFT JOIN albums a ON t.album_id = a.id
),

Thumbs AS (
    SELECT 
        playlist_id,
        GROUP_CONCAT(thumb, ',') AS thumbs
    FROM (
        SELECT playlist_id, thumb
        FROM RankedTracks
        WHERE rank <= 4
        ORDER BY playlist_id, rank
    )
    GROUP BY playlist_id
)

SELECT 
    ts.playlist_id,
    ts.track_count,
    ts.total_rating,
    ts.total_duration,
    ts.last_played_at,
    th.thumbs
FROM TrackStats ts
LEFT JOIN Thumbs th ON ts.playlist_id = th.playlist_id
ON CONFLICT(playlist_id) DO UPDATE SET
    track_count = excluded.track_count,
    total_rating = excluded.total_rating,
    total_duration = excluded.total_duration,
    last_played_at = excluded.last_played_at,
    thumbs = excluded.thumbs;

CREATE TRIGGER pt_insert AFTER INSERT ON playlist_tracks
BEGIN
    DELETE FROM playlist_cache WHERE playlist_id = NEW.playlist_id;
END;

CREATE TRIGGER pt_delete AFTER DELETE ON playlist_tracks
BEGIN
    DELETE FROM playlist_cache WHERE playlist_id = OLD.playlist_id;
END;

CREATE TRIGGER track_update AFTER UPDATE OF rating, duration, thumb_path, played_at ON tracks
BEGIN
    DELETE FROM playlist_cache
    WHERE playlist_id IN (
        SELECT playlist_id
        FROM playlist_tracks
        WHERE track_id = NEW.id
    );
END;

SELECT p.*, c.*
FROM playlists p
LEFT JOIN playlist_cache c ON p.id = c.playlist_id;

*/