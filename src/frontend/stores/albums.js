import { writable, get } from 'svelte/store';

import { sleep } from '../utils/sleep';

import { confirmAction } from './ui';
import { albumCount } from './library';
import { playSet } from './play';
import { searchQuery, activeOrder } from './selection';
import { selectedAlbum } from './player';
import { fetchCall } from './fetch';

export const top = writable([]);
export const albums = writable([]);
export const tracks = writable([]);

export const isLoading = writable(false);
export const hasMore = writable(false);

const queryAlbums = fetchCall(api.queryAlbums, albums, isLoading, hasMore, buildQuery);
export const fetch = (reset) => queryAlbums({}, reset);

const LOADING_TIMEOUT = 600;

let sort = get(activeOrder);
let loaded = false;


api.on('import-album', album => {

	console.debug('Adding album:', album);

	top.update(list => {

		const index = list.findIndex(a => a.id == album.id);
		if (index != -1) {

			const a = list[index];

			list.splice(index, 1, {
				...a,
				genre: album.genre,
				year: album.year,
				cover_path: album.cover_path
			});

			return list;
		}

		albumCount.update(n => n + 1);

		return [album, ...list];
	});
});

export async function loadAlbums() {
	if (loaded) return;

	const albums = await api.getAlbums(20);

	// console.debug('Top albums:', albums);

	top.set(albums);

	loaded = true;
}

export async function loadTracks(albumId) {

	isLoading.set(true);

	try {
		const [all] = await Promise.all([
			api.getAlbumTracks(albumId),
			sleep(LOADING_TIMEOUT)
		]);

		console.debug('Album tracks:', all.length);

		tracks.set(all);
	}
	finally {
		isLoading.set(false);
	}
}


export async function playAlbum(album, force) {

	if (!album)
		album = get(selectedAlbum);

	playSet(album, force);

	if (force) {
		top.update(list => {

			const index = list.findIndex(a => a.id === albumId);

			if (index == 0) return list;
			if (index > 0) list.splice(index, 1);

			return [album, ...list];
		});
	}
}

export async function deleteAlbum(album) {

	console.debug('Delete album:', album);

	if (!album)
		album = get(selectedAlbum);

	const albumId = album.id;
	const confirmed = await confirmAction({
		title: 'Delete Album?',
		message: `This will permanently remove "${album.name}". Your music files won't be touched.`,
		confirmText: 'Delete',
		danger: true
	});

	if (confirmed) {
		// Only now do we call the SQLite delete
		await api.deleteAlbum(albumId);

		selectFilter('all');

		top.update(list => list.filter(p => p.id !== albumId));
		albums.update(list => list.filter(p => p.id !== albumId));
	}
}

export function clearAlbums() {
	top.set([]);
	albums.set([]);
	tracks.set([]);
}

function buildQuery(params, lastRequest) {

	params.sort = params.sort || get(activeOrder);
	params.query = params.query || get(searchQuery);

	const changed = params.query != lastRequest.query ||
		params.sort != lastRequest.sort;

	Object.assign(lastRequest, params);

	return changed;
}

async function playRemoteAlbum(album) {
	const tracks = await api.getAlbumTracks(album.id, album.remote);
	
	enqueueTracks(tracks);
}