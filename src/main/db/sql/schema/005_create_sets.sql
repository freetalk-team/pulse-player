
CREATE VIEW IF NOT EXISTS collections AS
SELECT
	p.id, 
	p.name, 
	NULL as artist, 
	p.genre,
	p.cover_path, 
	p.icon, 
	p.played_at,
	p.created_at,
	p.track_count,
	p.total_rating,
	p.total_duration,
	p.total_size,
	p.last_played_at,
	'playlist' as type
FROM playlists p

UNION ALL

SELECT
	a.id, 
	a.name, 
	a.artist,
	a.genre,
	a.cover_path,
	'fa-record-vinyl' as icon, 
	a.played_at,
	a.created_at,
	a.track_count,
	a.total_rating,
	a.total_duration,
	a.total_size,
	a.last_played_at,
	'album' as type
FROM albums a;

CREATE VIEW IF NOT EXISTS sets AS
SELECT 
	*,
	0 as member_count
FROM collections

UNION ALL

SELECT
	p.id, 
	p.name, 
	NULL as artist, 
	p.genre,
	p.cover_path, 
	p.icon, 
	p.played_at,
	p.created_at,
	p.track_count,
	p.total_rating,
	p.total_duration,
	p.total_size,
	p.last_played_at,
	'playset' as type,
	p.member_count
FROM playsets p;


CREATE VIRTUAL TABLE IF NOT EXISTS sets_search USING fts5(
	name,
	artist,
	genre,
	content_id UNINDEXED, -- The original ID from playlists or albums
	type UNINDEXED    -- 'playlist' or 'album' or 'playset
);

-- --- PLAYLIST TRIGGERS ---

-- 1. Sync on New Playlist
CREATE TRIGGER IF NOT EXISTS after_playlist_insert
AFTER INSERT ON playlist
BEGIN
	INSERT INTO sets_search (name, artist, genre, content_id, type)
	VALUES (new.name, NULL, new.genre, new.id, 'playlist');
END;

-- 2. Sync on Rename/Genre Change
CREATE TRIGGER IF NOT EXISTS after_playlist_update
AFTER UPDATE OF name, genre ON playlist
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'playlist';

	INSERT INTO sets_search(name, genre, content_id, type)
  	VALUES (new.name, new.genre, new.id, 'playlist');
END;

-- 3. Cleanup on Delete
CREATE TRIGGER IF NOT EXISTS after_playlist_delete
AFTER DELETE ON playlist
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'playlist';
END;


-- --- ALBUM TRIGGERS ---

-- 4. Sync on New Album (from Scanner)
CREATE TRIGGER IF NOT EXISTS after_album_insert
AFTER INSERT ON album
BEGIN
	INSERT INTO sets_search (name, artist, genre, content_id, type)
	VALUES (new.name, new.artist, new.genre, new.id, 'album');
END;

-- 5. Sync on Metadata Update
CREATE TRIGGER IF NOT EXISTS after_album_update
AFTER UPDATE OF name, artist, genre ON album
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'album';

	INSERT INTO sets_search(name, artist, genre, content_id, type)
  	VALUES (new.name, new.artist, new.genre, new.id, 'album');
END;

-- 6. Cleanup on Delete
CREATE TRIGGER IF NOT EXISTS after_album_delete
AFTER DELETE ON album
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'album';
END;

-- --- PLAYSET TRIGGERS ---

-- 1. Sync on New Playset
CREATE TRIGGER IF NOT EXISTS after_playset_insert
AFTER INSERT ON playset
BEGIN
	INSERT INTO sets_search (name, artist, genre, content_id, type)
	VALUES (new.name, NULL, new.genre, new.id, 'playset');
END;

-- 2. Sync on Rename/Genre Change
CREATE TRIGGER IF NOT EXISTS after_playset_update
AFTER UPDATE OF name, genre ON playset
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'playset';

	INSERT INTO sets_search(name, genre, content_id, type)
  	VALUES (new.name, new.genre, new.id, 'playset');
END;

-- 3. Cleanup on Delete
CREATE TRIGGER IF NOT EXISTS after_playset_delete
AFTER DELETE ON playset
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'playset';
END;


CREATE VIEW IF NOT EXISTS playset_members AS
SELECT 
	s.*,
	pm.playset_id
FROM collections s
JOIN playset_member pm ON pm.member_id = s.id AND pm.member_type = s.type;
