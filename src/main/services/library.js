import { join, isAbsolute, basename, parse } from 'node:path';
import { statSync, unlinkSync as deleteFile  } from 'node:fs';

import store from '../store';
import { events } from '../events';

import { LibraryDatabase } from '../db/library';
import { TrackComponents } from '../components/track';
import { Track } from '../utils/track';

const MIN_RECORDING_TIME = 120;

class LibraryService {

	static instance = new LibraryService;

	#db = new LibraryDatabase;
	#track;
	#trackDestroyTimeout;

	get db() { return this.#db; }

	init() {
		this.#db.init(store);
		this.#registerEvents();
	}

	destroy() {
		this.#db.close();
	}

	// Tracks
	queryTracks(params, remote=false) {
		const tracks = this.#db.queryTracks(params);
		return remote 
			? LibraryService.remoteTrackPaths(tracks) 
			: LibraryService.localTrackPaths(tracks);
	}

	getRecentTracks(remote=false) {
		const tracks = this.#db.getRecentTracks();
		return remote 
			? LibraryService.remoteTrackPaths(tracks) 
			: LibraryService.localTrackPaths(tracks);
	} 


	// Albums
	getAlbum(id, remote=false) {
		const album = this.#db.getAlbum();
		return LibraryService.localCoverPath(album);
	}

	getAlbums(limit=20, remote=false) {
		const albums = this.#db.getAlbums(limit);
		return LibraryService.localCoverPaths(albums);
	}

	queryAlbums(params, remote=false) {
		const albums = this.#db.queryAlbums(params);
		return remote
			? LibraryService.remoteCoverPaths(albums)
			: LibraryService.localCoverPaths(albums);
	}

	getAlbumTracks(id, remote=false) {
		const tracks = this.#db.getAlbumTracks(id);
		return remote 
			? LibraryService.remoteTrackPaths(tracks) 
			: LibraryService.localTrackPaths(tracks);
	}

	// playlists
	getPlaylist(id, remote=false) {
		const album = this.#db.getPlaylist();
		return LibraryService.localCoverPath(album);
	}

	getPlaylists(limit=20) {
		const albums = this.#db.getPlaylists(limit);
		return LibraryService.localCoverPaths(albums);
	}

	queryPlaylists(params, remote=false) {
		const playlists = this.#db.queryPlaylists(params);
		return remote
			? LibraryService.remoteCoverPaths(playlists)
			: LibraryService.localCoverPaths(playlists);
	}

	getPlaylistTracks(id, remote=false) {
		const tracks = this.#db.getPlaylistTracks(id);
		return remote 
			? LibraryService.remoteTrackPaths(tracks) 
			: LibraryService.localTrackPaths(tracks);
	}

	// playsets
	getPlaysets(limit=20) {
		const albums = this.#db.getPlaysets(limit);
		return LibraryService.localCoverPaths(albums);
	}

	queryPlaysets(params, remote=false) {
		const playsets = this.#db.queryPlaysets(params);
		return remote
			? LibraryService.remoteCoverPaths(playsets)
			: LibraryService.localCoverPaths(playsets);
	}
	
	getPlaysetMembers(id, remote=false) {
		const members = this.#db.getPlaysetMembers(id);
		return LibraryService.localCoverPaths(members);
	}

	// collections
	queryCollections(collection, params, remote=false) {
		const collections = this.#db.queryCollections(collection, params);
		return remote
			? LibraryService.remoteCoverPaths(collections)
			: LibraryService.localCoverPaths(collections);
	}

	async #fetchTrackMeta(track) {
		if (!this.#track) {
			this.#track = new TrackComponents(store.databaseDir);
		}

		if (this.#trackDestroyTimeout)
			clearTimeout(this.#trackDestroyTimeout);

		this.#trackDestroyTimeout = setTimeout(() => {
			this.#track.destroy();

			this.#track = null;
			this.#trackDestroyTimeout = null;

		}, 30000);

		const album = await this.#track.fetchMeta(track, store.thumbDir);
		if (album) {

			album.artist = track.artist;
			
			// await this.#db.addAlbum(album, [track]);
			await this.#db.addAlbum(album);

			return {
				album: album.name,
				album_id: album.id,
				thumb_path: album.cover ? localThumbPath(album.cover) : null,
				genre: album.genre
			};
		}
	}

	#updateTrack(track, opt) {
		console.debug('Update track:', track, opt);

		const path = track.path;
		const info = { title: track.title };

		if (track.artist) info.artist = track.artist;
		if (track.album) info.album = track.album;
		if (track.genre) info.genre = track.genre;
		if (track.tag) info.tag = track.tag;
		if (track.thumb_path) {

			info.cover = track.thumb_path;

			if (track.thumb_path.startsWith(store.thumbDir))
				track.thumb_path = basename(track.thumb_path);
		}

		this.#db.updateTrack(track);

		if (opt.updateFile) {
			try {
				Track.update(path, info);
			}
			catch (e) {
				console.error('Failed to update file meta:', e);
			}
		}

	}

	#removeTrack(id, remove) {
		console.debug('[LIBRARY] remove track:', id, remove);

		if (remove) {
			const path = this.#db.getTrackPath(id);

			if (path) {
				console.debug('[LIBRARY] deleting file:', path);

				deleteFile(path);
			}
		}

		this.#db.deleteTrack(id);
	}

	// common
	static localTrackPaths(tracks) {
		for (const t of tracks)
			this.localThumbPath(t);

		return tracks;
	}

	static localThumbPath(track) {
		if (track.thumb_path && !isAbsolute(track.thumb_path))
			track.thumb_path = localThumbPath(track.thumb_path);

		return track;
	}

	static remoteTrackPaths(tracks) {
		for (const t of tracks) {

			const { name, ext } = parse(t.path);

			t.path = `/media/${t.id}`;
			t.mime = ext.substring(1).toLowerCase();

			if (t.thumb_path)
				t.thumb_path = remoteThumbPath(t.thumb_path);
		}

		return tracks;
	}

	static localCoverPaths(albums) {
		for (const a of albums) 
			LibraryService.localCoverPath(a);

		return albums;
	}

	static localCoverPath(album) {
		if (album.cover_path)
			album.cover_path = album.cover_path
				.split(',')
				.unique()
				.map(i => localThumbPath(i))
				.join(',');

		return album;
	}

	static remoteCoverPaths(albums) {
		for (const a of albums) 
			LibraryService.remoteCoverPath(a);

		return albums;
	}

	static remoteCoverPath(album) {
		if (album.cover_path)
			album.cover_path = remoteCoverPath(album.cover_path);

		return album;
	}

	registerHandlers(ipc) {
		ipc.handle('clear-library', () => this.#db.clear());
		ipc.handle('get-library-stat', () => this.#db.getStat());

		// Tracks
		ipc.handle('query-tracks', async (event, query) => this.queryTracks(query));
		ipc.handle('get-recent-tracks', async (event, { limit, offset }) => this.getRecentTracks(offset, limit));
		ipc.handle('update-last-played-track', async (event, id) => this.#db.updateLastPlayedTrack(id));
		ipc.handle('fetch-track-meta', async (event, track) => this.#fetchTrackMeta(track));
		ipc.handle('update-track', async (event, track, opt) => this.#updateTrack(track, opt));
		ipc.handle('remove-track', async (event, id, remove) => this.#removeTrack(id, remove));

		// Albums
		ipc.handle('get-albums', async (event, limit) => this.getAlbums(limit));
		ipc.handle('query-albums', async (event, params) => this.queryAlbums(params));
		ipc.handle('get-album-tracks', async (event, albumId) => this.getAlbumTracks(albumId));
			
		// Playlists
		ipc.handle('get-playlist', async (event, id) => this.getPlaylist(id));
		ipc.handle('get-playlists', async (event, limit) => this.getPlaylists(limit));
		ipc.handle('query-playlists', async (event, params) => this.queryPlaylists(params));
		ipc.handle('create-playlist', async (event, playlist) => this.#db.createPlaylist(playlist));
		ipc.handle('get-playlist-tracks', async (event, id) => this.getPlaylistTracks(id));
		ipc.handle('delete-playlist', async (event, id) => this.#db.deletePlaylist(id));
		ipc.handle('update-playlist', async (event, id, data) => this.#db.updatePlaylist(id, data));
		ipc.handle('update-playlist-order', async (event, id, tracks, purge) => this.#db.updatePlaylistOrder(id, tracks, purge));

		// Playsets
		ipc.handle('get-playsets', async (event, limit) => this.getPlaysets(limit));
		ipc.handle('query-playsets', async (event, params) => this.queryPlaysets(params));
		ipc.handle('create-playset', async (event, playset) => this.#db.createPlayset(playset));
		ipc.handle('get-playset-members', async (event, id) => this.getPlaysetMembers(id));
		ipc.handle('update-playset', async (event, id, data) => this.#db.updatePlayset(id, data));
		ipc.handle('delete-playset', async (event, id) => this.#db.deletePlayset(id));
		ipc.handle('update-playset-order', async (event, id, members, purge) => this.#db.updatePlaysetOrder(id, members, purge));

		// Collections
		ipc.handle('query-collections', async (event, collection, params,) => this.queryCollections(collection, params));
		ipc.handle('update-last-played', async (event, id, type) => this.#db.updateLastPlayed(id, type));

		// Genres
		ipc.handle('get-genres', async (event) => this.#db.getGenres());
		ipc.handle('add-genre', async (event, genre) => this.#db.addGenre(genre));
	}

	#registerEvents() {
		events.on('recording:ended', station => {

			if (station.duration < MIN_RECORDING_TIME) {
				console.debug('[LIBRARY] recording too short:', station);
				// delete file?
				return;
			}

			const track = Track.meta(station.path);
			// const stat = statSync(station.path);

			track.title = track.title || `${station.name} - ${new Date(station.startTime).toLocalDateString()}`;
			track.duration = track.duration ?? station.duration;
			track.thumb_path = station.favicon ? store.thumbRelativePath(station.favicon) : null;

			console.debug('[LIBRARY] adding recording:', track);

			this.#db.addTrack(track);

			if (!track.id) {
				console.error('[LIBRARY] failed to add track:', track);
				return;
			}

			let playlist = this.#db.findPlaylist(station.name);

			if (!playlist) {

				playlist = {
					name: station.name,
					icon: 'fa-radio'
				};

				this.#db.addPlaylist(playlist, [track]);

				Object.assign(playlist, {
					track_count: 1,
					total_rating: 0,
					total_duration: track.duration,
					cover_path: station.favicon 
				});

				events.emit('playlist:added', playlist);
			}
			else {
				this.#db.addTrackToPlaylist(playlist.id, track);
			}

			track.playlist_id = playlist.id;
			track.thumb_path = station.favicon;

			events.emit('track:added', track);
		});
	}
}

function localThumbPath(path) {
	return join(store.thumbDir, path);
}

function remoteThumbPath(path) {
	return isAbsolute(path) ? '' : `/thumb/${path}`;
}

function remoteCoverPath(path) {
	return path.split(',')
		.map(i => remoteThumbPath(i))
		.join(',');

}

export default LibraryService.instance;