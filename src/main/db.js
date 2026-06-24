
import { DatabaseSync } from 'node:sqlite';

import { setup } from './db/setup';
import { runMigrations } from './db/migrate';

class Storage {

	#db;

	init(dbPath, migrations=[]) {

		const db = new DatabaseSync(dbPath);

		setup(db);
		runMigrations(db, migrations);

		this.#db = db;
	}

	get(id, table) {
		try {
			return this.#db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id);
		}
		catch (e) {
			console.error(`🚨 Failed to fetch ${table}:`, e);
		}
	}

	insert(data, table) {

		const columns = Object.keys(data);
		const values = Object.values(data);
		const placeholders = Array(columns.length).fill('?').join(',');

		try {
			this.#db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`).run(...values);

		}
		catch (e) {
			console.error(`🚨 Failed to insert ${table}:`, e);
		}

	}

	count(table) {
		try {

			return this.#db.prepare(`SELECT COUNT(id) as count FROM ${table}`)
				.get()
				.count;

		} catch (e) {
			console.error("SQL Error:", e.message);
		}

		return 0;
	}

	getLibraryStat() {
		try {
			return this.#db.prepare(`
				select 
					(select COUNT(*) from tracks where type='audio') as audio_count, 
					(select COUNT(*) from tracks where type='video') as video_count,
					(select COUNT(*) from album) as album_count,
					(select COUNT(*) from playlists) as playlist_count,
					(select COUNT(*) from playsets) as playset_count
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

	getTop(collection='playlist', limit=20) {

		// const where = collection == 'album'
		// 	? 'WHERE track_count > 2'
		// 	: '';

		try {
			// Query all albums, sorted alphabetically
			// const stmt = this.#db.prepare('SELECT id, name, artist, cover_path FROM albums ORDER BY name ASC');
			const stmt = this.#db.prepare(`
				SELECT * FROM ${collection}
				ORDER BY total_rating DESC, created_at DESC
				LIMIT ?
			`);

			return stmt.all(limit);
		} catch (e) {
			console.error(`🚨 Failed to fetch ${collection}:`, e);
		}

		return []; 
	}

	clearLibrary() {
		this.#transaction((db) => {

			db.prepare('DELETE FROM playsets').run();
			db.prepare('DELETE FROM playlists').run();
			db.prepare('DELETE FROM albums').run();
			db.prepare('DELETE FROM tracks').run();

		});
	}

	// Tracks
	getTracks(filter, query, playlistId = null, sort = 'title', offset = 0, limit = 200) {

		let sql = 'SELECT t.* ';

		const where = [];
		const params = [];
		const order = [];

		if (query && query.trim() !== "") {
			const safeQuery = query.replace(/[^\w\s]/gi, '');

			sql += 'FROM tracks_search s JOIN track t ON t.id = s.track_id';

			where.push('tracks_search MATCH ?');
			params.push(`${safeQuery}*`);
			order.push('s.rank'); // Always prioritize search relevance


		} else {
			sql += 'FROM track t';

			order.push('t.title ASC');
		}

		if (playlistId) {
			sql += ' JOIN playlist_tracks pt ON t.id = pt.track_id';

			where.unshift('pt.playlist_id = ?');
			params.unshift(playlistId);
		}

		// 3. Handle Type Filter
		if (filter === 'audio' || filter === 'video') {
			where.unshift('t.type = ?');
			params.unshift(filter);
		}

		switch (sort) {
			case 'rating':
			order.unshift('t.rating DESC');
			break;

			case 'recent':
			order.unshift('t.played_at DESC');
			break;

			case 'created':
			order.unshift('t.id DESC'); // Assuming sequential IDs for "Recently Added"
			break;

			case 'playlist':
			order.unshift('pt.position ASC');
			break;
		}

		if (where.length > 0)
			sql += ` WHERE ${where.join(' AND ')}`;

		sql += ` ORDER BY ${order.join(', ')} LIMIT ? OFFSET ?`;

		params.push(limit, offset);

		console.debug('[DB]', sql, params);

		try {
			return this.#db.prepare(sql).all(...params);
		} catch (e) {
			console.error("SQL Error:", e.message);
		}

		return [];
	}

	getTrackPath(id) {
		try {
			return this.#db.prepare(`SELECT path FROM tracks WHERE id=?`).get(id).path;
		}
		catch (e) {
			console.error(`🚨 Failed to fetch ${table}:`, e);
		}
	}

	getRecentTracks(offset = 0, limit = 200) {
		const sql = `
			SELECT * FROM tracks
			WHERE played_at NOT NULL
			ORDER BY played_at DESC
			LIMIT ? OFFSET ?
		`;

		try {
			return this.#db.prepare(sql).all(limit, offset);
		} catch (e) {
			console.error("SQL Error:", e.message);
		}

		return [];
	}

	updateTrack(track) {

		const sql = `
			UPDATE tracks
			SET
				title = ?,
				artist = ?,
				genre = COALESCE(?, genre),
				thumb_path = COALESCE(?, thumb_path),
				tag = ?
			WHERE id = ?
		`;

		try {
			this.#db.prepare(sql).run(
				track.title,
				track.artist,
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
		try {
			 return this.#db.prepare(`
				DELETE FROM tracks
				WHERE ${typeof idOrPath == 'number' ? 'id' : 'path'} = ?`).run(idOrPath);
		}
		catch (e) {
			console.error("SQL Error:", e.message);
		}
	}

	updateLastPlayed(id, table='tracks') {

		const updateRating = table === 'tracks';

		try {
			 return this.#db.prepare(`
				UPDATE ${table} SET 
					played_at = CURRENT_TIMESTAMP
					${updateRating ? ',rating=rating+1' : ''}
				WHERE id = ?`).run(id);
		}
		catch (e) {
			console.error("SQL Error:", e.message);
		}
	}

	incrementRating(id, val=1, table='tracks') {
		try {
			return this.#db.prepare(`
				UPDATE ${table} SET rating = rating + ? WHERE id = ?
			`).run(val, id);
		}
		catch (e) {
			console.error('🚨 Failed to increment track rating:', error);
		}
	}

	searchTracks(query) {
		const sql = `
			SELECT t.*, s.artist, s.album 
			FROM tracks_search s
			JOIN tracks t ON t.id = s.track_id
			WHERE tracks_search MATCH ?
			ORDER BY rank
			LIMIT 50
		`;

		return this.#db.prepare(sql).all(`${query}*`);
	}

	addTracks(tracks=[], album) {

		const existing = [];

		this.#transaction((db) => {

			// console.log('Adding tracks', tracks);

			const sql = `
				INSERT OR IGNORE INTO tracks (title, artist, genre, path, duration, type, thumb_path, tag)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				RETURNING id`;

			const stmt = db.prepare(sql);

			for (const t of tracks) {
				const row = stmt.get(
					t.title,
					t.artist || null,
					t.genre || null,
					t.path,
					t.duration,
					t.type,
					t.thumb_path || null,
					t.tag || null
				);

				// If inserted, assign ID
				if (row)
					t.id = row.id;
				else
					existing.push(t);
			}
		});

		if (existing.length > 0) {

			const stmt = this.#db.prepare('SELECT * FROM track WHERE path=?');

			for (const t of existing) {
				const track = stmt.get(t.path);

				Object.assign(t, track);
				t.existing = true;
			}
		}
	}

	// Albums
	getAlbumTracks(albumId, offset=0, limit=200) {

		try {
			const stmt = this.#db.prepare(`
				SELECT * FROM album_track
				WHERE album_id = ? 
				ORDER BY position ASC, title ASC
				LIMIT ? OFFSET ?
				`);

			return stmt.all(albumId, limit, offset);
		
		} catch (e) {
			console.error('🚨 Failed to fetch album tracks:', e);
		}

		return []; 
	}

	addAlbum(album, tracks=[]) {

		// const sql = `
		// 	INSERT OR IGNORE INTO albums (name, artist, genre, year, cover_path) 
		// 	VALUES (?, ?, ?, ?, ?)
		// 	RETURNING id
		// `;

		const sql = `
			INSERT INTO albums (name, artist, genre, year, cover_path)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(name, artist) DO UPDATE SET
			genre = COALESCE(NULLIF(excluded.genre, ''), albums.genre),
			year = COALESCE(excluded.year, albums.year),
			cover_path = COALESCE(excluded.cover_path, albums.cover_path)
			RETURNING id, (rowid = last_insert_rowid()) AS inserted
		`;

		console.debug('[DB] Adding album:', album);


		this.#transaction(db => {

			const row = db.prepare(sql)
				.get(
					album.name, 
					album.artist, 
					album.genre || null, 
					album.year || 0, 
					album.cover_path || null
				);

			album.id = row.id;
			album.existing = !row.inserted;

			// if (row?.id) {
			// 	album.id = row.id;

			// }
			// else {
			// 	const info = db.prepare('SELECT * FROM albums WHERE name=? AND artist=?')
			// 		.get(album.name, album.artist);

			// 	Object.assign(album, info);

			// 	album.existing = true;
			// }

			const stmt = db.prepare('INSERT OR IGNORE INTO album_tracks(album_id, track_id, position) VALUES(?, ?, ?)');

			let pos = 1;

			for (const i of tracks)
				stmt.run(album.id, i.id, pos++);

		});
	}

	

	// Playlists
	savePlaylist(id, name, tracks) {

		this.#transaction((db) => {

			if (id) {
				db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(id);
			}
			else {
				const res = db.prepare('INSERT INTO playlists (name) VALUES (?)').run(name);

				id = res.lastInsertRowid;
			}

			if (tracks && tracks.length > 0) {
				// Insert current tracks with their position
				const stmt = db.prepare('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)');
			
				tracks.forEach((track, index) => stmt.run(id, typeof track == 'object' ? track.id : track, index));
			}
		});

		return id;
	}

	deletePlaylist(id) {

		try {
			db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
		} catch (e) {
			console.error('🚨 Failed to delete playlist:', e);
		}
	}

	renamePlaylist(id, name) {
		try {
			this.#db.prepare('UPDATE playlists SET name = ? WHERE id = ?').run(name, id);
		} catch (error) {
			console.error('🚨 Failed to rename playlist:', error);
		}
	}

	getPlaylistTracks(id) {
		try {
			// 1. Join tracks with playlist_tracks to get metadata + sequence
			// 2. We use ORDER BY position to respect user's manual reordering

			const stmt =  this.#db.prepare(`
				SELECT * FROM playlist_track pt
				WHERE pt.playlist_id = ?
				ORDER BY pt.position ASC
			`);

			return stmt.all(id);

		} catch (error) {
			console.error('🚨 Failed to fetch playlist tracks:', error);
		}

		return [];
	}

	updatePlaylistOrder(id, tracks, purge=false) {

		console.debug('Update playlist order:', id, tracks);

		this.#transaction((db) => {
			// const stmt = db.prepare(`
			// 	UPDATE playlist_tracks 
			// 	SET position = ? 
			// 	WHERE playlist_id = ? AND track_id = ?
			// `);

			if (purge)
				db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(id);

			const stmt = db.prepare(`
				INSERT OR REPLACE INTO playlist_tracks VALUES (?, ?, ?)
			`);

			for (const i of tracks)
				stmt.run(id, i.track_id || i.id, i.position);
		});
	}

	updatePlaylistMetadata(id, icon, icon_color, genre) {
		try {

			this.#db.prepare(`
				UPDATE playlists 
				SET icon = ?, icon_color = ?, genre = ? 
				WHERE id = ?
			`).run(icon, icon_color, genre, id);

		} catch (error) {
			console.error('🚨 Failed to update playlist meta:', error);
			return [];
		}
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
				FROM playlist_tracks pt
				JOIN tracks t ON pt.track_id = t.id
			)
			SELECT playlist_id, thumb_path
			FROM RankedTracks
			WHERE rank <= 4
		`;

		try {
			const rows = this.#db.prepare(sql).all();
	
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

	// Playsets
	getPlaysetMembers(id) {

		try {
			const stmt = this.#db.prepare(`
				SELECT 
					s.*,
					pm.start_time,
					pm.end_time
				FROM playset_members pm
				RIGHT JOIN sets s ON pm.member_id = s.id
				WHERE pm.playset_id = ?
				ORDER BY start_time ASC
			`);

			return stmt.all(id);

		} catch (error) {
			console.error('🚨 Failed to fetch playsets members:', error);
		}

		return []; 
	}

	// Collections
	getCollections(collections, query, sort = 'rating', id = null, offset = 0, limit = 200) {

		console.debug('[DB] Collection:', collections);

		if (typeof collections === 'string' && collections === 'playset' && id)
			return this.#getPlayset(id, query, sort, offset, limit);

		return this.#getCollections(collections, query, sort, offset, limit);
	}

	// Components
	getComponents(type) {
		if (type) {
			try {

				const components = this.#db.prepare(`
					SELECT name,code,config,builtin FROM components 
					WHERE type='${type}' AND enabled=1
					ORDER BY priority ASC
				`).all();

				for (const comp of components) {
					comp.config = JSON.parse(comp.config);
				}

				return components;
			}
			catch (e) {
				console.error(`🚨 Failed to load ${type} components:`, e);
			}

			return [];
		}

		const sql = `
			SELECT id,name,description,type,builtin,enabled FROM components
			ORDER BY priority ASC
		`;

		try {
			return this.#db.prepare(sql).all();
		}
		catch (e) {
			console.error('🚨 Failed to fetch components:', e);
		}

		return [];
	}

	updateComponentsPriority(components) {

		console.debug('Update components order:', components);

		this.#transaction((db) => {
			// const stmt = db.prepare(`
			// 	UPDATE playlist_tracks 
			// 	SET position = ? 
			// 	WHERE playlist_id = ? AND track_id = ?
			// `);


			const stmt = db.prepare('UPDATE components set priority=? WHERE id=?');

			for (const i of components)
				stmt.run(i.priority, i.id);
		});
	}

	saveComponent(component) {

		console.debug('[DB] Saving component:', component);

		if (component.id) {

			const sql = `
				UPDATE components set name=?, description=?, config=?, code=?, updated_at=?
				WHERE id=?`;

			try {

				this.#db.prepare(sql).run(
					component.name, 
					component.description, 
					JSON.stringify(component.config),
					component.code,
					new Date().toISOString(),
					component.id
				);

				return component.id;
			}
			catch (e) {
				console.error('🚨 Failed to update component:', e);
			}

		}
		else {
			const sql = `
				INSERT INTO components (name, description, type, schema, config, code, enabled, priority)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				RETURNING id
			`;

			try {

				const { id } = this.#db.prepare(sql).get(
					component.name, 
					component.description, 
					component.type,
					JSON.stringify(component.schema),
					JSON.stringify(component.config),
					component.code || null,
					component.enabled ? 1 : 0,
					component.priority
				);

				return id;
			}
			catch (e) {
				console.error('🚨 Failed to create component:', e);
			}
		}
	}

	deleteComponent(id) {
		try {
			this.#db.prepare('DELETE FROM components WHERE id=?').run(id);
		}
		catch (e) {
			console.error('🚨 Failed to delete component:', e);
		}
	}

	enableComponent(id, enable) {
		try {
			this.#db.prepare('UPDATE components set enabled=? WHERE id=?').run(enable ? 1 : 0, id);
		}
		catch (e) {
			console.error('🚨 Failed to enable component:', e);
		}
	}

	addPost(userId, type, item, content) {
		try {
			return this.#db
				.prepare('INSERT INTO posts (user_id, type, item, content) VALUES(?, ?, ?, ?) RETURNING id, created_at')
				.get(
					userId,
					type,
					item ? JSON.stringify(item) : null,
					content
				);
		}
		catch (e) {
			console.error('🚨 Failed to add post:', e);
		}
	}

	deletePost(id) {
		try {
			this.#db.prepare('DELETE FROM posts WHERE id=?').run(id);
		}
		catch (e) {
			console.error('🚨 Failed to delete post:', e);
		}
	}

	getPosts(offset, limit) {
		try {
			return this.#db.prepare('SELECT * FROM posts ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);
		}
		catch (e) {
			console.error('🚨 Failed to add post:', e);
		}

		return [];
	}

	getComments(postId) {
		try {
			return this.#db
				.prepare('SELECT * FROM user_comments WHERE post_id = ? ORDER BY created_at ASC')
				.all(postId);
		}
		catch (e) {
			console.error('🚨 Failed to fetch comments:', e);
		}

		return [];
	}

	addComment(content, postId, parentId, user) {
		try {
			return this.#db
				.prepare('INSERT INTO comments(content, post_id, parent_comment_id, user_id) VALUES(?,?,?,?) RETURNING id, created_at')
				.get(
					content,
					postId,
					parentId || null,
					user
				);
		}
		catch (e) {
			console.error('🚨 Failed to add comment:', e);
		}

		return [];
	}

	updateUser(id, name, photo) {
		const sql = `
			INSERT INTO users (id, name, photo)
			VALUES (?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				name = COALESCE(NULLIF(excluded.name, ''), users.name),
				photo = COALESCE(NULLIF(excluded.photo, ''), users.photo),
				updated_at = CURRENT_TIMESTAMP
		`;

		try {
			return this.#db
				.prepare(sql)
				.run(id, name, photo || null);
		}
		catch (e) {
			console.error('🚨 Failed to update user:', e);
		}
	}

	// private
	#getCollections(collections, query, sort = 'rating', offset = 0, limit = 200) {
		const safeQuery = query?.trim().replace(/[^\w\s]/gi, '') || "";

		if (safeQuery)
			return this.#queryCollections(collections, safeQuery, sort, offset, limit);

		// WHERE type = 'album' OR type = 'playlist'

		let where = '', table = 'sets';

		const params = [];

		if (typeof collections === 'string') {

			switch (collections) {

				case 'all':
				break;

				case 'sets':
				collections = ['playlist', 'album'];
				break;

				default:
				table = collections;
				break;

			}
		}
		
		if (Array.isArray(collections)) {
			where = `WHERE ${collections.map(t => `type = '${t}'`).join(' OR ')}`;
		}
		
		const sql = `
			SELECT * FROM ${table}
			${where}
			ORDER BY ${
				sort === 'rating' ? 'total_rating DESC' : 
				sort === 'recent' ? 'last_played_at DESC' : 
				'created_at DESC'
			}
			
			LIMIT ? OFFSET ?
			`;

		try {
			return this.#db.prepare(sql).all(limit, offset);
		}
		catch (e) {
			console.error('🚨 Failed to load collections:', e);
			return [];
		}
	}

	#queryCollections(collections, query, sort = 'rating', offset = 0, limit = 200) {

		let where = '', table = 'sets', type = 'U.type';

		if (typeof collections === 'string') {

			switch (collections) {

				case 'all':
				break;

				case 'sets':
				collections = ['playlist', 'album'];
				break;

				default:
				table = collections;
				type = "'" + collections + "'";
				break;

			}
		}

		if (Array.isArray(collections)) {
			where = `(${collections.map(t => `s.type = '${t}'`).join(' OR ')}) AND`;
		}

		//console.log('Quering collection', table, query);

		const sql = `
			SELECT U.* FROM sets_search s
			JOIN ( 
				SELECT * FROM ${table}
			) U ON (U.id = s.content_id AND s.type = ${type})
			WHERE ${where} sets_search MATCH ?

			ORDER BY ${
				sort === 'rating' ? 'total_rating DESC' : 
				sort === 'recent' ? 'last_played_at DESC' : 
				'created_at DESC'
			}
		
			LIMIT ? OFFSET ?
		`;

		// console.log('Search:', sql);


		try {
			return this.#db.prepare(sql).all(`${query}*`, limit, offset);
		}
		catch (e) {
			console.error('🚨 Failed to query collections:', e);
			return [];
		}
	}

	#getPlayset(id, query, sort = 'rating', offset = 0, limit = 200) {
		const safeQuery = query?.trim().replace(/[^\w\s]/gi, '') || "";

		if (safeQuery)
			return this.#queryPlayset(id, safeQuery, sort, offset, limit);

		const sql = `
			SELECT 
				v.* 
			FROM sets v
			JOIN playset_members pm 
				ON v.id = pm.member_id 
				AND v.type = pm.member_type
				AND pm.playset_id = ?

			--ORDER BY pm.position

			ORDER BY ${
				sort === 'rating' ? 'total_rating DESC' : 
				sort === 'recent' ? 'last_played_at DESC' : 
				'created_at DESC'
			}
			
			LIMIT ? OFFSET ?
		`;

		try {
			return this.#db.prepare(sql).all(id, limit, offset);
		}
		catch (e) {
			console.error('🚨 Failed to query playset:', e);
			return [];
		}
	}

	#queryPlayset(id, query, sort = 'rating', offset = 0, limit = 200) {

		const sql = `
			SELECT 
				v.* 
			FROM sets v
			JOIN playset_members pm 
				ON v.id = pm.member_id 
				AND v.type = pm.member_type
			JOIN sets_search s 
				ON v.id = s.content_id 
				AND v.type = s.type
			WHERE s.sets_search MATCH ? 
			AND pm.playset_id = ?
			--ORDER BY pm.position

			ORDER BY ${
				sort === 'rating' ? 'total_rating DESC' : 
				sort === 'recent' ? 'last_played_at DESC' : 
				'created_at DESC'
			}
			
			LIMIT ? OFFSET ?
		`;

		try {
			return this.#db.prepare(sql).all(`${query}*`, id, limit, offset);
		}
		catch (e) {
			console.error('🚨 Failed to query playset:', e);
			return [];
		}
	}

	#transaction(fn) {
		this.#db.exec('BEGIN TRANSACTION');

		try {

			fn(this.#db);

			this.#db.exec('COMMIT');
		}
		catch (e) {
			console.error('🚨 Failed to execute transaction:', e);

			this.#db.exec('ROLLBACK');
		}
	}
}

const db = new Storage;

export default db;
