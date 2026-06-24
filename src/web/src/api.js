import db from './db'

const SAVE_PREFS_TIMEOUT = 5000;
const prefs = JSON.parse(localStorage.getItem('prefs') || "{}")

let savePrefsTimeout

const api = {
	on: () => {}

	, async getLibrary() {
		const res = await fetch('/api/library');
		return res.json();
	}

	, async getTracks(query) { 
		const params = new URLSearchParams(Object.clean(query));
		const res = await fetch(`/api/tracks?${params.toString()}`);

		return res.json();
	}

	, getRecentTracks() { 
		return db.latest('recent', 0, 200);
	}

	, updateLastPlayed(track) {
		track.played_at = new Date().toDateTimeString();
		return db.put('recent', track)
	}

	, async getAlbums() { 
		const res = await fetch('/api/library/album?limit=16');
		return res.json();
	}

	, async getAlbumTracks(albumId) {
		const res = await fetch(`/api/album/${albumId}/tracks`);
		return res.json();
	}

	, async updateLastPlayedAlbum(albumId) {
	}

	, async getPlaylists() { 
		const res = await fetch('/api/library/playlist?limit=16');
		const playlists = await res.json();

		playlists.forEach(i => i.remote = true);

		// todo: add local playlists

		return playlists;
	}

	, async getPlaylistTracks(playlistId) {
		const res = await fetch(`/api/playlist/${playlistId}/tracks`);
		return res.json();
	}

	, async updateLastPlayedPlaylist(playlistId) {

	}

	, async getPlaysetMembers(playsetId) {
		const res = await fetch(`/api/playlist/${playsetId}/tracks`);
		return res.json();
	}

	, async getPlaysets() { 
		const res = await fetch('/api/library/playset?limit=16');
		return res.json();
	}

	, async getCollections(collections, query) {

		if (!collections)
			collections = 'all';
		else if (Array.isArray(collections))
			collections = 'sets';

		const params = new URLSearchParams(Object.clean(query));
		const res = await fetch(`/api/collection/${collections}?${params.toString()}`);
		const items = await res.json();

		items.forEach(i => i.remote = true);

		// todo: add local playlists

		return items;
	}

	, getComponents() { return [] }

	, getPrefs() {
		return prefs
	}

	, setPref(key, value) {
		console.debug('[PREF]', key, value);

		prefs[key] = value;

		if (savePrefsTimeout)
			clearTimeout(savePrefsTimeout);

		savePrefsTimeout = setTimeout(() => {

			localStorage.setItem('prefs', JSON.stringify(prefs));
			savePrefsTimeout = null;

		}, SAVE_PREFS_TIMEOUT);
	}
}


window.api = api;
window.isElectron = false