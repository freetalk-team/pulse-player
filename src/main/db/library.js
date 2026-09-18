
import { DatabaseBase } from './base';

import createTracksSQL from './sql/schema/001_create_tracks.sql?raw';
import createAlbumsSQL from './sql/schema/002_create_albums.sql?raw';
import createPlaylistsSQL from './sql/schema/003_create_playlists.sql?raw';
import createPlaysetsSQL from './sql/schema/004_create_playsets.sql?raw';
import createSetsSQL from './sql/schema/005_create_sets.sql?raw';
import createGenresSQL from './sql/schema/010_create_genres.sql?raw';

export class LibraryDatabase extends DatabaseBase {

	static dbname = 'library';

	init(storage) {

		super.init(LibraryDatabase.dbname, storage);

		this.enableOptimizations();
	}

	onCreate() {
		this.exec(createTracksSQL);
		this.exec(createAlbumsSQL);
		this.exec(createPlaylistsSQL);
		this.exec(createPlaysetsSQL);
		this.exec(createSetsSQL);
		this.exec(createGenresSQL);
	}

	getStat() {
		try {
			return this.db.prepare(`
				select 
					(select COUNT(*) from track where type='audio') as audio_count, 
					(select COUNT(*) from track where type='video') as video_count,
					(select COUNT(*) from albums) as album_count,
					(select COUNT(*) from playlist) as playlist_count,
					(select COUNT(*) from playset) as playset_count
				`).get();
		} catch (err) {
			console.error("SQL Error:", err.message);
		}

		return { 
			audio_count: 0, 
			video_count: 0, 
			album_count: 0,
			playlist_count: 0,
			playset_count: 0
		};
	}

	getTop(collection, limit=20) {

		// const where = collection == 'album'
		// 	? 'WHERE track_count > 2'
		// 	: '';

		const sql = `
			SELECT * FROM ${collection}
			ORDER BY total_rating DESC, created_at DESC
			LIMIT ?
		`;

		try {
			// Query all albums, sorted alphabetically
			// const stmt = this.#db.prepare('SELECT id, name, artist, cover_path FROM albums ORDER BY name ASC');
			const items = this.db.prepare(sql).all(limit);

			console.debug('[DB] top:', items.length, sql);

			return items;
		} catch (e) {
			console.error(`🚨 Failed to fetch ${collection}:`, e);
		}

		return []; 
	}

	clear() {
		this.transaction((db) => {
			db.prepare('DELETE FROM playset').run();
			db.prepare('DELETE FROM playlist').run();
			db.prepare('DELETE FROM album').run();
			db.prepare('DELETE FROM track').run();
		});
	}

	findTrack(col, value) {
		return super.find('tracks', col, value);
	}

	queryTracks(params={}) {

		const table = params.playlist ? 'playlist_tracks' : 'tracks';

		params.fts = 'tracks_search';

		setOrder(params);

		const where = {};

		if (params.playlist)
			where.playlist_id = params.playlist;
		else if (params.filter && params.filter != 'all')
			where.type = params.filter;

		params.where = where;

		return super.query(table, params);
	}

	getTrack(id, columns) {
		return super.get('tracks', id, columns);
	}

	getTrackPath(id) {
		const row = this.getTrack(id, 'path');
		return row.path;
	}

	getRecentTracks(offset = 0, limit = 200) {
		return super.query('tracks', {
			offset, limit,
			where: { played_at: 'not_null' },
			order: ['played_at', 'DESC']
		});
	}

	updateTrack(track) {

		const sql = `
			UPDATE track
			SET
				title = ?,
				artist = ?,
				genre = COALESCE(?, genre),
				thumb_path = COALESCE(?, thumb_path),
				tag = ?
			WHERE id = ?
		`;

		try {
			this.db.prepare(sql).run(
				track.title,
				track.artist || null,
				track.genre || null, 
				track.thumb_path || null,
				track.tag || null,
				track.id
			);
		} catch (e) {
			console.error("🚨 Failed to uprate track:", e.message);
		}
	}

	deleteTrack(idOrPath) {
		super.delete('track', idOrPath);
	}

	updateLastPlayedTrack(id) {
		this.update('track_stat', id, { 
			played_at: 'timestamp()',
			rating: 'increment()'
		});
	}

	updateLastPlayed(id, collection) {

		this.update(collection, id, { 
			played_at: 'timestamp()'
		});

	}

	incrementRating(id, val=1, table='track') {
		super.increment(table, id, 'rating', val);
	}

	addTrack(track, move=true) {

		this.transaction(db => {

			if (track.album && track.artist) {

				// console.debug('[DB] inserting album:', track.album);

				const sql = this.#insertAlbumSql();

				const row = db.prepare(sql).get(
					track.album, 
					track.artist, 
					track.genre || null, 
					track.year || null, 
					track.thumb_path || null);

				track.album_id = row.id;
			}

			const sql = this.#insertTrackSql(move);

			const row = db.prepare(sql).get(
				track.hash,
				track.title,
				track.artist || null,
				track.album || null,
				track.album_id || null,
				track.genre || null,
				track.type,
				track.path,
				track.duration ?? 0,
				track.tag || null,
				track.thumb_path || null,
				track.size
			);

			track.id = row.id;
			track.existing = !row.inserted;
		});

		return track;
	}

	addTracks(tracks=[], album) {
		this.transaction(() => {
			this.#insertTracks(tracks, album, true);
		});
	}

	getAlbum(id) {
		return super.get('albums', id);
	}

	getAlbums(limit=20) {
		return this.getTop('albums', limit);
	}

	queryAlbums(params) {

		setOrderCollection(params);

		if (params.query) {
			const query = params.query.trim().replace(/[^\w\s]/gi, '');

			if (query) 
			 	return this.#searchCollection('albums', query, params);
		}

		return super.fetch('albums', params);
	}

	getAlbumTracks(album_id, offset=0, limit=200) {
		return super.query('album_tracks', {
			offset, limit,
			where: { album_id },
			order: 'position'
		});
	}

	addAlbumTracks(id, tracks) {

		this.transaction((db) => {
			const stmt = db.prepare('INSERT OR IGNORE INTO album_track (album_id, track_id, position) VALUES (?, ?, ?)');
			tracks.forEach((track, index) => stmt.run(id, track.id, index + 1));
		});
	}

	addAlbum(album, tracks=[], addTracks) {

		console.debug('[DB] Adding album:', album);

		this.transaction(db => {

			const row = db.prepare(this.#insertAlbumSql())
				.get(
					album.name, 
					album.artist, 
					album.genre || null, 
					album.year || 0, 
					album.cover_path || album.cover || null
				);

			album.existing = !row.inserted;
			album.id = row.id;

			if (addTracks) {
				this.#insertTracks(tracks, album.id, true);
			}

			const stmt = db.prepare('INSERT OR IGNORE INTO album_track(album_id, track_id, position) VALUES(?, ?, ?)');

			let pos = 1;

			for (const i of tracks)
				stmt.run(album.id, i.id, pos++);
		});

		return album;
	}

	updateTracksThumb(tracks, thumb) {
		console.debug('Updating tracks:', tracks);

		this.transaction((db) => {
			const stmt = db.prepare('UPDATE track SET thumb_path=? WHERE id=?');

			for (const t of tracks)
				stmt.run(thumb, t.id);
		});
	}

	updateAlbum(id, data) {

		const genre = data.genre || null
			, year = data.year || null
			, cover = data.cover || null;

		this.transaction((db) => {
			db.prepare(`
				UPDATE album SET 
					year = COALESCE(?, year),
					genre = COALESCE(?, genre),
					cover_path = COALESCE(?, cover_path)
				WHERE id=?`)
				.run(year, genre, cover, id);
					
			db.prepare(`
				UPDATE track SET
					genre = COALESCE(genre, ?),
					thumb_path = COALESCE(thumb_path, ?)
				WHERE album_id=?`)
				.run(genre, cover, id);
		});

		// try {

		// 	this.db.prepare('UPDATE album SET cover_path=? WHERE id=?').run(thumb, id);
		// 	this.db.prepare('UPDATE track SET thumb_path=? WHERE album_id=? AND thumb_path IS NULL').run(thumb, id);
		// } catch (e) {
		// 	console.error('[DB] error:', e);
		// }

		// const rows = this.db.prepare('SELECT * FROM album').all();
		// console.debug('RES:', rows);
	}

	updateLastPlayedAlbum(id) {
		this.updateLastPlayed(id, 'album');
	}

	// playlists
	getPlaylist(id) {
		return super.get('playlists', id);
	}

	findPlaylist(name) {
		return super.find('playlist', 'name', name);
	}

	getPlaylists(limit=20) {
		return this.getTop('playlists', limit);
	}

	queryPlaylists(params) {

		setOrderCollection(params);

		if (params.query) {
			const query = params.query.trim().replace(/[^\w\s]/gi, '');

			if (query) 
			 	return this.#searchCollection('playlists', query, params);
		}

		return super.fetch('playlists', params);
	}


	updateLastPlayedPlaylist(id) {
		this.updateLastPlayed(id, 'playlist');
	}

	createPlaylist(playlist) {

		const { tracks, id, ...data } = playlist;

		let playlistId = id;

		this.transaction((db) => {

			if (!id) {
				playlistId = this.insert('playlist', data);
			}

			if (tracks && tracks.length > 0) {
				if (id)
					db.prepare('DELETE FROM playlist_track WHERE playlist_id = ?').run(id);

				// Insert current tracks with their position
				const stmt = db.prepare('INSERT INTO playlist_track (playlist_id, track_id, position) VALUES (?, ?, ?)');
			
				tracks.forEach((track, index) => stmt.run(playlistId, typeof track == 'object' ? track.id : track, index));
			}
		});

		return playlistId;
	}

	addPlaylist(playlist, tracks, addTracks) {
		this.transaction((db) => {

			const row = this.prepare(this.#insertPlaylistSql())
				.get(
					playlist.name, 
					playlist.genre || null, 
					playlist.icon
				);

			playlist.id = row.id;

			if (addTracks) {
				this.#insertTracks(tracks, null, addTracks == 'move')
			}

			if (tracks && tracks.length > 0) {
				// Insert current tracks with their position
				const stmt = db.prepare('INSERT INTO playlist_track (playlist_id, track_id, position) VALUES (?, ?, ?)');
			
				tracks.forEach((track, index) => stmt.run(playlist.id, typeof track == 'object' ? track.id : track, index));
			}
		});

		return playlist;
	}

	deletePlaylist(id) {
		super.delete('playlist', id);
	}

	renamePlaylist(id, name) {
		super.update('playlist', id, { name });
	}

	getPlaylistTracks(playlist_id) {
		return super.query('playlist_tracks', {
			limit: 1000,
			where: { playlist_id },
			order: 'position'
		});
	}

	addTrackToPlaylist(id, track) {
		const table = this.table('playlist_track');
		const track_id = typeof track == 'object' ? track.id : track;

		super.insert('playlist_track', {
			playlist_id: id,
			track_id
		}, null);
	}

	updatePlaylistOrder(id, tracks, purge=false) {

		console.debug('Update playlist order:', id, tracks);

		const table = this.table('playlist_track');

		this.transaction((db) => {
			// const stmt = db.prepare(`
			// 	UPDATE playlist_tracks 
			// 	SET position = ? 
			// 	WHERE playlist_id = ? AND track_id = ?
			// `);

			if (purge)
				db.prepare(`DELETE FROM ${table} WHERE playlist_id = ?`).run(id);

			const stmt = db.prepare(`INSERT OR REPLACE INTO ${table} VALUES (?, ?, ?)`);

			for (const i of tracks)
				stmt.run(id, i.track_id || i.id, i.position);
		});
	}

	updatePlaylist(id, data) {
		super.update('playlist', id, data);
	}

	getPlaylistPreviews() {
		// const sql = `
		// 	WITH RankedTracks AS (
		// 		SELECT 
		// 			pt.playlist_id,
		// 			t.thumb_path,
		// 			ROW_NUMBER() OVER (PARTITION BY pt.playlist_id ORDER BY pt.position ASC) as rank
		// 		FROM playlist_tracks pt
		// 		JOIN tracks t ON pt.track_id = t.id
		// 	)
		// 	SELECT playlist_id, thumb_path
		// 	FROM RankedTracks
		// 	WHERE rank <= 4
		// `;

		const sql = `
			WITH RankedTracks AS (
				SELECT 
					pt.playlist_id,
					t.thumb_path,
					ROW_NUMBER() OVER (
						PARTITION BY pt.playlist_id 
						ORDER BY t.rating DESC, pt.position ASC
					) as rank
				FROM playlist_track pt
				JOIN tracks t ON pt.track_id = t.id
			)
			SELECT playlist_id, thumb_path
			FROM RankedTracks
			WHERE rank <= 4
		`;

		try {
			const rows = this.db.prepare(sql).all();
	
			// Group them by playlist_id: { 1: [path1, path2], 2: [path1] }
			return rows.reduce((acc, row) => {
				if (!acc[row.playlist_id]) acc[row.playlist_id] = [];
				acc[row.playlist_id].push(row.thumb_path);
				return acc;
			}, {});
		}
		catch (error) {
			console.error('🚨 Failed to load playlist previews:', error);
			return [];
		}
	}

	// playsets
	getPlaysets(limit=20) {
		return this.getTop('playsets', limit);
	}

	queryPlaysets(params) {

		setOrderCollection(params);

		if (params.query) {
			const query = params.query.trim().replace(/[^\w\s]/gi, '');

			if (query) 
			 	return this.#searchCollection('playsets', query, params);
		}

		return super.fetch('playsets', params);
	}

	getPlaysetMembers(id) {

		try {
			const stmt = this.db.prepare(`
				SELECT 
					s.*,
					pm.start_time,
					pm.end_time
				FROM playset_member pm
				RIGHT JOIN collections s ON pm.member_id = s.id AND pm.member_type = s.type
				WHERE pm.playset_id = ?
				ORDER BY start_time ASC
			`);

			return stmt.all(id);

		} catch (error) {
			console.error('🚨 Failed to fetch playsets members:', error);
		}

		return []; 
	}

	createPlayset(playset) {

		let id;

		const { members, ...data } = playset;

		this.transaction((db) => {

			id = this.insert('playset', data);

			if (members && members.length > 0) {
				const stmt = db.prepare('INSERT INTO playset_member (playset_id, member_id, member_type, position) VALUES (?, ?, ?, ?)');
				members.forEach((m, index) => stmt.run(id, m.member_id, m.member_type, index));
			}
		});

		return id;
	}

	updatePlayset(id, data) {
		super.update('playset', id, data);
	}

	deletePlayset(id) {
		super.delete('playset', id);
	}

	updatePlaysetOrder(id, members, purge=false) {

		console.debug('Update playset order:', id, members);

		this.transaction((db) => {
			// const stmt = db.prepare(`
			// 	UPDATE playlist_tracks 
			// 	SET position = ? 
			// 	WHERE playlist_id = ? AND track_id = ?
			// `);

			if (purge)
				db.prepare('DELETE FROM playset_member WHERE playset_id = ?').run(id);

			const stmt = db.prepare(`
				INSERT OR REPLACE INTO playset_member (
					playset_id, 
					member_id, 
					member_type,
					position,
					start_time,
					end_time
				) VALUES (?, ?, ?, ?, ?, ?)
			`);

			for (const i of members)
				stmt.run(
					id, 
					i.member_id || i.id, 
					i.member_type || i.type, 
					i.position,
					i.start_time || null,
					i.end_time || null
				);
		});
	}

	querySets(params) {
		return this.#queryCollections('sets', params);
	}

	queryCollections(collection, params) {
		return typeof collection == 'number'
			? this.#queryPlayset(collection, params) 
			: this.#queryCollections(collection, params);
	}

	getGenres() {
		const all = this.ls('genres', 0, 200);
		return all.map(i => i.genre);
	}

	addGenre(genre) {
		this.prepare('INSERT OR IGNORE INTO genre VALUES(?)').run(genre);
	}

	#queryCollections(collection, params={}) {

		params.offset = params.offset ?? 0;
		params.limit = params.limit ?? 50;

		setOrderCollection(params);

		const query = params.query?.trim().replace(/[^\w\s]/gi, '') || "";

		if (query)
			return this.#searchCollection(collection, query, params);

		return this.#fetchCollections(collection, params);
	}

	#fetchCollections(collection, params) {
		const table = this.table(collection);
		const args = [];
		
		const sql = `
			SELECT * FROM ${table}
			ORDER BY ${this.buildOrder(params.order)}
			LIMIT ? OFFSET ?
			`;

		console.debug('[DB] query collections:', sql);

		try {
			return this.db.prepare(sql).all(params.limit, params.offset);
		}
		catch (e) {
			console.error('🚨 Failed to load collections:', e);
			return [];
		}
	}

	#searchCollection(collection, query, params) {

		let where = '', table = this.table(collection), types, type = 'U.type';

		switch (collection) {

			case 'albums':
			types = ['album'];
			type = "'album'";
			break;

			case 'playlists':
			types = ['playlist'];
			type = "'playlist'";
			break;

			case 'playsets':
			types = ['playset'];
			type = "'playset'";
			break;

			case 'collections':
			types = ['playlist', 'album'];
			break;

		}

		if (Array.isArray(types)) {
			where = `(${types.map(t => `s.type = '${t}'`).join(' OR ')}) AND`;
		}

		//console.log('Quering collection', table, query);
		const fts = this.table('sets_search');
		const sql = `
			SELECT U.* FROM ${fts} s
			JOIN (SELECT * FROM ${table}) U ON (U.id = s.content_id AND s.type = ${type})
			WHERE ${where} sets_search MATCH ?
			ORDER BY bm25(${fts}), ${this.buildOrder(params.order, 'U.')}
			LIMIT ? OFFSET ?`;

		console.debug('[DB] Search collection:', sql, query);

		try {
			return this.db.prepare(sql).all(`${query}*`, params.limit, params.offset);
		}
		catch (e) {
			console.error('🚨 Failed to query collections:', e);
			return [];
		}
	}

	#queryPlayset(id, params) {
		
		params.offset = params.offset ?? 0;
		params.limit = params.limit ?? 50;

		setOrderCollection(params);

		const query = params.query?.trim().replace(/[^\w\s]/gi, '') || "";

		if (query)
			return this.#searchPlayset(id, query, params);

		return this.#fetchPlayset(id, params);
	}

	#fetchPlayset(id, params) {
		const table = this.table('playset_members');
		const args = [];
		
		const sql = `
			SELECT * FROM ${table}
			WHERE playset_id = ?
			ORDER BY ${this.buildOrder(params.order)}
			LIMIT ? OFFSET ?
			`;

		console.debug('[DB] query playset:', sql);

		try {
			return this.db.prepare(sql).all(id, params.limit, params.offset);
		}
		catch (e) {
			console.error('🚨 Failed to load collections:', e);
			return [];
		}
	}

	#searchPlayset(id, query, params) {

		const table = this.table('playset_members');

		//console.log('Quering collection', table, query);
		const fts = this.table('sets_search');
		const sql = `
			SELECT U.* FROM ${fts} s
			JOIN ( 
				SELECT * FROM ${table}
			) U ON (U.id = s.content_id AND s.type = U.type)
			WHERE U.playset_id = ? AND sets_search MATCH ?
			ORDER BY bm25(${fts}), ${this.buildOrder(params.order, 'U.')}
			LIMIT ? OFFSET ?
		`;

		console.debug('[DB] Search playset:', sql);

		try {
			return this.db.prepare(sql).all(id, `${query}*`, params.limit, params.offset);
		}
		catch (e) {
			console.error('🚨 Failed to query collections:', e);
			return [];
		}
		
	}

	#insertTracks(tracks, albumId, move) {
		const stmt = this.prepare(this.#insertTrackSql(move));

		for (const track of tracks) {

			track.album_id = albumId;
			// console.debug('[DB] Adding track:', track);

			const row = stmt.get(
				track.hash,
				track.title,
				track.artist || null,
				track.album || null,
				track.album_id || null,
				track.genre || null,
				track.type,
				track.path,
				track.duration ?? 0,
				track.tag || null,
				track.thumb_path || null,
				track.size
			);

			track.id = row.id;
			track.existing = !row.inserted;
		}
	}

	#insertAlbumSql() {
		return `
			INSERT INTO album (
				name,
				artist,
				genre,
				year,
				cover_path)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT (name, artist, year) 
			DO UPDATE SET
				genre = COALESCE(album.genre, excluded.genre),
				year = COALESCE(album.year, excluded.year),
				cover_path = COALESCE(album.cover_path, excluded.cover_path)
			RETURNING id, (rowid = last_insert_rowid()) AS inserted
			`;
	}

	#insertPlaylistSql() {
		return `
			INSERT INTO playlist (name, genre, icon)
			VALUES (?, ?, ?)
			RETURNING id
			`;
	}

	#insertTrackSql(move=true) {
		return `INSERT OR IGNORE INTO track (
			hash,
			title,
			artist,
			album,
			album_id,
			genre,
			type,
			path,
			duration,
			tag,
			thumb_path,
			size)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT (hash) 
		DO UPDATE SET
			artist = COALESCE(excluded.artist, track.artist),
			album  = COALESCE(excluded.album, track.album),
			genre  = COALESCE(excluded.genre, track.genre),
			duration = COALESCE(excluded.duration, track.duration),
			${move ? 'path = COALESCE(excluded.path, track.path),' : ''}
			thumb_path = COALESCE(excluded.thumb_path, track.thumb_path),
			size = COALESCE(excluded.size, track.size),
			tag = COALESCE(excluded.tag, track.tag)
		RETURNING id, (rowid = last_insert_rowid()) AS inserted`;
	}
}

function setOrder(params) {
	switch (params.sort) {
		case 'rating':
		params.order = ['rating', 'DESC'];
		break;

		case 'created':
		params.order = ['created_at', 'DESC'];
		break;

		case 'recent':
		params.order = ['played_at', 'DESC'];
		break;
	}
}

function setOrderCollection(params) {
	switch (params.sort) {
		case 'rating':
		params.order = ['total_rating', 'DESC'];
		break;

		case 'created':
		params.order = ['created_at', 'DESC'];
		break;

		case 'recent':
		params.order = ['last_played_at', 'DESC'];
		break;
	}
}