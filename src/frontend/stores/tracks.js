import { writable, get } from 'svelte/store';

import { sleep } from '../utils/sleep';

import { searchQuery, activeOrder } from './selection';
import { selectedAlbum, selectedFilter, selectedPlaylist } from './player';
import { currentTrack, recent } from './play';

export const tracks = writable([]);
export const editTrack = writable(null);

export const audioCount = writable(0);
export const videoCount = writable(0);

export const isImporting = writable(false);
export const importProgress = writable(0);

export const isLoading = writable(false);
export const hasMore = writable(false);

let offset = 0;
let lastRequestId = 0; // 👈 Track the latest request
let filter;
let sort;
let search;
let searchTimeout;
let fetching = false;
let playlist;
let album;

const LIMIT = 30;
const LOADING_TIMEOUT = 600;

const ImportFilters = ['all', 'audio', 'video'];
const Filters = ['all', 'audio', 'video', 'playlist', 'album'];

const updateQueue = [];

api.on('import-start', () => {
	console.log('Import started');

	if (ImportFilters.includes(filter))
		activeOrder.set('created');

	isImporting.set(true);
});

api.on('import-end', () => {
	console.log('Import ended');
	isImporting.set(false);
	importProgress.set(0);
});

api.on('import-progress', ({ file, progress }) => {
	// console.log('Import progress:', progress, file.title);

	if (!file.existing) {

		const count = file.type == 'audio' ? audioCount : videoCount;

		if (filter == 'all' || file.type == filter) {

			const items = get(tracks);
			
			const limit = offset + LIMIT;
			const newItems = addTrack(items, file, limit);

			if (newItems) {
				const more = newItems.length >= limit;

				// console.log('Adding track:', file, more);

				tracks.set(newItems);
				hasMore.set(more);
			}
		}
		
		count.update(n => n + 1);
	}

	importProgress.set(progress);
});

export function initTracks(audio, video) {

	audioCount.set(audio);
	videoCount.set(video);

	selectedPlaylist.subscribe(v => {
		playlist = v;

		if (!filter) return;
		if (!playlist) return;

		reset();
		fetch();
	});

	selectedAlbum.subscribe(v => {
		album = v;

		if (!filter) return;
		if (!album) return;

		reset();
		fetch();
	});

	activeOrder.subscribe(v => {
		if (!filter) return;

		sort = v;

		reset();
		fetch();
	});

	searchQuery.subscribe(v => {
		if (!filter) return;

		search = v;

		clearTimeout(searchTimeout);

		searchTimeout = setTimeout(() => {
			reset();
			fetch();
		}, 300);
	});

	selectedFilter.subscribe(v => {

		if (Filters.includes(v)) {
			filter = v;

			reset();
			fetch();
		}
		else {
			filter = null;
		}
		
	});

	currentTrack.subscribe(track => {
		if (updateQueue.length > 0) {
			const t = updateQueue[0];

			console.debug('Update queue', t.id, track);

			if (t.id !== track?.id) {
				api.updateTrack(t, {
					fetchMeta: false, 
					updateDb: false,
					updateFile: true,
					coverPicture: true // todo: check prefs
				});

				updateQueue.shift();
			}
		}
	});
}


function reset() {
	offset = 0;
	fetching = false;

	tracks.set([]);
	hasMore.set(true);

	// console.log('Reseting ...');
}

export async function fetch() {

	if (fetching) return;

	fetching = true;

	// 1. Generate a unique ID for this specific fetch call
	const requestId = ++lastRequestId;
	const query = getQuery();

2
	isLoading.set(true);

	// console.trace('Fetchig tracks ...');

	try {
		const [newItems] = await Promise.all([
			album ? api.getAlbumTracks(album.id) : api.getTracks(query),
			sleep(LOADING_TIMEOUT) 
		]);

		console.debug('Tracks:', newItems);

		// 2. THE FIX: If a newer request has started, discard this one!
		if (requestId !== lastRequestId) {
			// console.log('🚫 Discarding stale search result');
			return; 
		}

		if (newItems.length < LIMIT) 
			hasMore.set(false);
		
		// ✅ REASSIGN for reactivity
		tracks.update(items => [...items, ...newItems])

		offset += LIMIT;

	} finally {
		// 3. Only stop loading if this is still the active request
		if (requestId === lastRequestId) {
			isLoading.set(false);
		}

		fetching = false;

		// console.log('Fetching done');
	}

}

function getQuery() { 
	return { 
		query: search, 
		filter, 
		sort, 
		offset, 
		limit: LIMIT, 
		playlistId: playlist?.id 
	};
}

function addTrack(items, track, limit) {


	if (sort == 'created') {

		items.unshift(track);

		if (items.length > limit)
			items.splice(limit - 1, 1);

		return items;
	}

	if (items.length >= limit)
		return null;

	
	items.push(track);

	return items;
}

export async function updateTrack(track, fetchMeta=true, updateFile=true) {

	console.debug('Updating track:', track, fetchMeta, updateFile);

	track.title = track.title.trim();
	track.artist = track.artist.trim();

	let addToQueue = false;

	const currentTrackId = get(currentTrack)?.id;
	const isCurrent = currentTrackId === track.id;

	if (updateFile && isCurrent) {
		updateFile = false;
		addToQueue = true;
	}

	track = await api.updateTrack(track, {
		fetchMeta, 
		updateFile, 
		updateDb: true,
		coverPicture: true // todo: check prefs
	});

	if (isCurrent) {
		currentTrack.set(track);
		editTrack.set(null);
	}
	else {
		editTrack.set(track);
	}

	tracks.update(list => list.map(i => i.id == track.id ? track : i));
	recent.update(list => list.map(i => i.id == track.id ? track : i));

	if (addToQueue)
		updateQueue.push(track);
}

function subscribeSkipInitial(store, callback) {
	let initialized = false;

	return store.subscribe(value => {
		if (!initialized) {
			initialized = true;
			return;
		}

		callback(value);
	});
}