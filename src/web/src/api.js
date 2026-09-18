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

	, async queryTracks(query) { 
		const params = new URLSearchParams(Object.clean(query));
		const res = await fetch(`/api/tracks?${params.toString()}`);
		return res.json();
	}

	, getRecentTracks() { 
		return db.latest('recent', 0, 200);
	}

	, updateLastPlayedTrack(track) {
		track.played_at = new Date().toDateTimeString();
		return db.put('recent', track)
	}

	, async queryAlbums(query) { return queryCollection('albums', query); }

	, async getAlbumTracks(albumId) {
		const res = await fetch(`/api/album/${albumId}/tracks`);
		return res.json();
	}

	, async updateLastPlayed() {
	}

	, async queryPlaylists(query) { return queryCollection('playlists', query); }

	, async getPlaylistTracks(playlistId) {
		const res = await fetch(`/api/playlist/${playlistId}/tracks`);
		return res.json();
	}


	, async getPlaysetMembers(playsetId) {
		const res = await fetch(`/api/playlist/${playsetId}/tracks`);
		return res.json();
	}

	, async queryPlaysets(query) { return queryCollection('playsets', query); }

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

	, async queryStations(query) {

		delete query.favourite;

		const params = new URLSearchParams(Object.clean(query));
		const res = await fetch(`/api/stations?${params.toString()}`);
		return res.json();
	}

	, async updateLastPlayedStation() {}
	, async setStationFavourite() {}

	, getComponents() { return [] }

	, getPrefs() {
		return prefs
	}

	, getPref(key, defaultValue) {
		const parts = key.split('.');
		let obj = prefs;

		for (const p of parts) {
			if (obj == null || typeof obj !== 'object' || !(p in obj)) {
				return defaultValue;
			}

			obj = obj[p];
		}

		return obj;
	}

	, setPref(key, value) {
		console.debug('[PREF]', key, value);

		if (typeof key == 'string') {

			const parts = key.split('.');
			let obj = prefs;

			for (let i = 0; i < parts.length - 1; i++) {
				const p = parts[i];

				if (typeof obj[p] !== 'object' || obj[p] === null) {
					obj[p] = {};
				}

				obj = obj[p];
			}

			obj[parts[parts.length - 1]] = value;

		}
		else {
			for (const [k, v] of Object.entries(key))
				prefs[k] = v;
		}

		if (savePrefsTimeout)
			clearTimeout(savePrefsTimeout);

		savePrefsTimeout = setTimeout(() => {

			localStorage.setItem('prefs', JSON.stringify(prefs));
			savePrefsTimeout = null;

		}, SAVE_PREFS_TIMEOUT);
	}
}

async function queryCollection(collection, query) {
	const params = new URLSearchParams(Object.clean(query));
	const res = await fetch(`/api/collection/${collection}?${params.toString()}`);
	return res.json();
}

window.api = api;
window.isElectron = false