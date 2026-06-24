CREATE VIEW IF NOT EXISTS sets AS
SELECT
	p.id, 
	p.name, 
	NULL as artist, 
	p.genre,
	p.cover_path, 
	p.icon, 
	p.icon_color, 
	p.played_at,
	p.created_at,
	p.track_count,
	p.total_rating,
	p.total_duration,
	p.last_played_at,
	'playlist' as type
FROM playlist p

UNION ALL

SELECT
	p.id, 
	p.name, 
	NULL as artist, 
	p.genre,
	p.cover_path, 
	p.icon, 
	p.icon_color, 
	p.played_at,
	p.created_at,
	p.track_count,
	p.total_rating,
	p.total_duration,
	p.last_played_at,
	'playset' as type
FROM playset p

UNION ALL

SELECT
	a.id, 
	a.name, 
	a.artist,
	a.genre,
	a.cover_path,
	'fa-record-vinyl' as icon, 
	'text-gray-600' as icon_color,
	a.played_at,
	a.created_at,
	a.track_count,
	a.total_rating,
	a.total_duration,
	a.last_played_at,
	'album' as type
FROM album a;

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
AFTER INSERT ON playlists
BEGIN
	INSERT INTO sets_search (name, artist, genre, content_id, type)
	VALUES (new.name, NULL, new.genre, new.id, 'playlist');
END;

-- 2. Sync on Rename/Genre Change
CREATE TRIGGER IF NOT EXISTS after_playlist_update
AFTER UPDATE OF name, genre ON playlists
BEGIN
	UPDATE sets_search
	SET name = new.name,
		genre = new.genre
	WHERE content_id = old.id AND type = 'playlist';
END;

-- 3. Cleanup on Delete
CREATE TRIGGER IF NOT EXISTS after_playlist_delete
AFTER DELETE ON playlists
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'playlist';
END;


-- --- ALBUM TRIGGERS ---

-- 4. Sync on New Album (from Scanner)
CREATE TRIGGER IF NOT EXISTS after_album_insert
AFTER INSERT ON albums
BEGIN
	INSERT INTO sets_search (name, artist, genre, content_id, type)
	VALUES (new.name, new.artist, new.genre, new.id, 'album');
END;

-- 5. Sync on Metadata Update
CREATE TRIGGER IF NOT EXISTS after_album_update
AFTER UPDATE OF name, artist ON albums
BEGIN
	UPDATE sets_search
	SET name = new.name,
		artist = new.artist,
		genre = new.genre
	WHERE content_id = old.id AND type = 'album';
END;

-- 6. Cleanup on Delete
CREATE TRIGGER IF NOT EXISTS after_album_delete
AFTER DELETE ON albums
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'album';
END;

-- --- PLAYSET TRIGGERS ---

-- 1. Sync on New Playset
CREATE TRIGGER IF NOT EXISTS after_playset_insert
AFTER INSERT ON playsets
BEGIN
	INSERT INTO sets_search (name, artist, genre, content_id, type)
	VALUES (new.name, NULL, new.genre, new.id, 'playset');
END;

-- 2. Sync on Rename/Genre Change
CREATE TRIGGER IF NOT EXISTS after_playset_update
AFTER UPDATE OF name, genre ON playsets
BEGIN
	UPDATE sets_search
	SET name = new.name,
		genre = new.genre
	WHERE content_id = old.id AND type = 'playset';
END;

-- 3. Cleanup on Delete
CREATE TRIGGER IF NOT EXISTS after_playset_delete
AFTER DELETE ON playsets
BEGIN
	DELETE FROM sets_search WHERE content_id = old.id AND type = 'playset';
END;
