import { writable } from 'svelte/store';

// Map of itemId -> { progress: 0-100, status: 'downloading' | 'completed' }
// export const downloads = writable({
//     34: { progress: 35, status: 'downloading' }
// });

export const albums = writable({});
export const playlists = writable({});
export const tracks = writable({});

api.on('download-progress', msg => {
	const store = getStore(msg.type);
	updateDownload(store, msg.id, msg.status, msg.progress, msg.remoteId);
});

export function download(type, item, opt) {
	const store = getStore(type);
	updateDownload(store, item.id, 'downloading', 0, item.remote);

	api.download(type, item, opt);
}


export function getDownloadOptions(type) {
	let opt = {};

	switch (type) {
		case 'track':
		opt = api.getPref('dir.track', {});

		opt.subdirPlaceholders = ['genre'];
		opt.filenamePlaceholders = ['title', 'artist', 'album', 'album_year'];
		break;

		case 'album': 
		opt = api.getPref('dir.album', {});

		opt.subdirPlaceholders = ['artist', 'album', 'album_year', 'genre'];
		opt.filenamePlaceholders = ['index', 'title', 'artist', 'album', 'album_year'];
		break;

		case 'playlist': 
		opt = api.getPref('dir.playlist', {});

		opt.subdirPlaceholders = ['genre'];
		opt.filenamePlaceholders = ['title', 'artist', 'album', 'album_year'];
		break;

		case 'recording': 
		opt = api.getPref('dir.recording', {});

		opt.subdirPlaceholders = ['station'];
		opt.filenamePlaceholders = ['title', 'station', 'artist'];
		break;
	}

	console.debug('Download options:', opt);

	return opt;
}

export function saveDownloadOptions(type, opt) {

	const options = {
		rootDir: opt.rootDir,
		subdirPattern: opt.subdirPattern,
		filenamePattern: opt.filenamePattern,
		skipOptions: opt.skipOptions,
		overwrite: opt.overwrite
	};

	api.setPref(`dir.${type}`, options);
}

function updateDownload(store, id, status, progress, remoteId) {

	const downloadId = `${remoteId}_${id}`;

	store.update(all => {

		if (status === 'completed') {
			delete all[downloadId]; // Remove from store when done, or set status = 'completed'
		} else {
			all[downloadId] = { progress, status };
		}

		return { ...all };
	});
}

function getStore(type) {
	switch (type) {
		case 'album':
		return albums;

		case 'playlist':
		return playlists;

		case 'track':
		return tracks;
	}
}