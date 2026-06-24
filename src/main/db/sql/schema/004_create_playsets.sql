CREATE TABLE IF NOT EXISTS playsets (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	is_active BOOLEAN DEFAULT 0, -- Is this "Radio Mode" currently on?
	icon TEXT DEFAULT 'fa-diamond',
	icon_color TEXT,
	genre TEXT DEFAULT 'Various',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	played_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_playsets_id ON playsets(id);
CREATE INDEX IF NOT EXISTS idx_playsets_created ON playsets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playsets_recent ON playsets(played_at DESC) WHERE played_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS playset_members (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	playset_id INTEGER NOT NULL,
	member_id INTEGER NOT NULL, -- ID of the Playlist or Album
	member_type TEXT NOT NULL,  -- 'playlist' or 'album'
	position INTEGER,
	start_time TEXT,            -- e.g., '10:00'
	end_time TEXT,              -- e.g., '12:00'
	FOREIGN KEY(playset_id) REFERENCES playsets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pm_playset ON playset_members(playset_id, position);
CREATE INDEX IF NOT EXISTS idx_pm_member_id ON playset_members(member_id);
CREATE INDEX IF NOT EXISTS idx_pm_member_type ON playset_members(member_type);

CREATE VIEW IF NOT EXISTS playset AS
WITH MemberThumbs AS (
	SELECT 
		pm.playset_id,

		CASE 
			WHEN pm.member_type = 'playlist' THEN
				-- take ONLY first thumb from comma-separated list
				substr(v_p.cover_path, 1, instr(v_p.cover_path || ',', ',') - 1)

			WHEN pm.member_type = 'album' THEN
				v_a.cover_path
		END AS thumb,

		pm.position
	FROM playset_members pm

	LEFT JOIN playlist v_p 
		ON pm.member_id = v_p.id 
		AND pm.member_type = 'playlist'

	LEFT JOIN album v_a 
		ON pm.member_id = v_a.id 
		AND pm.member_type = 'album'
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
	FROM MemberThumbs
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

	th.thumbs AS cover_path

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