import { writable, get } from 'svelte/store';

import { confirmAction } from './ui';
import { searchQuery, activeOrder } from './selection';
import { selectedAlbum, selectedFilter, selectedPlaylist } from './player';
import { currentTrack, updateTrack as updatePlayTrack } from './play';
import { audioCount, videoCount } from './library';
import { fetchCall, LIMIT } from './fetch';

export const tracks = writable([]);
export const editTrack = writable(null);

export const isLoading = writable(false);
export const hasMore = writable(false);

export const fetch = fetchCall(api.queryTracks, tracks, isLoading, hasMore, buildQuery);

const updateQueue = [];

let activeRequest;

currentTrack.subscribe(current => {
	if (updateQueue.length > 0) {
		const { track, opt } = updateQueue[0];

		console.debug('Update queue', track.id);

		if (current?.id !== track.id) {
			api.updateTrack(track, opt);

			updateQueue.shift();
		}
	}
});

api.on('import-progress', (progress) => {
	console.debug('Event import progress:', progress);
	if (!activeRequest) return;
	addTracks(progress.tracks);
});

api.on('track:added', track => {
	if (!activeRequest) return;
	addTracks([track]);
});

function addTracks(newTracks) {

	const { query, sort, filter, playlist } = activeRequest;

	const filtered = newTracks.filter(t => 
		(filter == 'all' || filter == t.type) &&
		playlist == t.playlist &&
		matchQuery(query, t)
	);

	tracks.update(v => merge(v));

	function merge(tracks) {

		let limit = LIMIT - (tracks.length % LIMIT);
		let max = tracks.length + limit;

		if (tracks.length > 0 && limit == LIMIT) {
			limit = 0;
			max = tracks.length;
		}

		console.debug(`Merging tracks: max=${max}, limit=${limit}, sort=${sort}, tracks=${tracks.length}, added=${newTracks.length}`);

		if (sort == 'created') {
			newTracks.push(...tracks);
			tracks = newTracks.slice(0, max);
		}
		// else if (sort == 'rating') {
		// 	const pos = tracks.findIndex(i => );
		// }
		else {
			tracks.push(...newTracks.slice(0, limit));
		}

		activeRequest.offset = tracks.length;
		
		hasMore.set(tracks.length % LIMIT == 0);
		
		return tracks;
	}

	function matchQuery(track) {
		if (!query) return true;

		const q = query.toLowerCase();
		const match = (m) => m && m.toLowerCase().search(q) != -1;

		return match(track.title) || match(track.artist) || match(track.album);
	}
}

export function setTracks(newTracks) {
	tracks.set(newTracks.slice(0, LIMIT));
	hasMore.set(newTracks.length >= LIMIT);
}

export async function updateTrack(track, fetchMeta=true, updateFile=true) {

	console.debug('Updating track:', track, fetchMeta, updateFile);

	track.title = track.title.trim();
	track.artist = track.artist?.trim();

	let addToQueue = false;

	const currentTrackId = get(currentTrack)?.id;
	const isCurrent = currentTrackId === track.id;

	if (updateFile && isCurrent) {
		updateFile = false;
		addToQueue = true;
	}

	if (isCurrent) {
		currentTrack.set(track);
		editTrack.set(null);
	}
	else {
		editTrack.set(track);
	}

	tracks.update(list => list.map(i => i.id == track.id ? track : i));

	updatePlayTrack(track);

	const opt = { updateFile };

	if (addToQueue) {
		updateQueue.push({ track, opt });
	}
	else {
		await api.updateTrack(track, opt);
	}
}

export async function removeTrack(track) {
	const confirmed = await confirmAction({
		title: 'Delete track?',
		message: `This will remove "${track.title}".`,
		confirmText: 'Delete',
		danger: true,
		options: __PLATFORM__ === 'desktop'
			? { remove: { checked: false, label: 'Permanently remove file', accent: 'red' } }
			: null
	});

	if (confirmed) {

		try {

			await api.removeTrack(track.id, confirmed.remove?.checked);

			if (get(editTrack)?.id == track.id)
				editTrack.set(null);

			if (track.type == 'video') videoCount.update(n => n - 1);
			else audioCount.update(n => n - 1);

			tracks.update(list => list.filter(i => i.id != track.id));
		}
		catch (e) {
			console.error('Failed to remove track:', e.message);
			report.error('Failed to remove track!');
		}
			
	}


}

export async function fetchTrackMeta(track) {
	return api.fetchTrackMeta({
		id: track.id,
		title: track.title,
		artist: track.artist
	});
}

function buildQuery(params, lastRequest) { 
	
	params.query = params.query ?? get(searchQuery);
	params.sort = params.sort ?? get(activeOrder);
	params.filter = params.filter ?? get(selectedFilter);

	const changed = params.query != lastRequest.query ||
		params.filter != lastRequest.filter ||
		params.sort != lastRequest.sort ||
		params.playlist != lastRequest.playlist;

	//console.debug('Query:', changed, params, lastRequest);

	Object.assign(lastRequest, params);

	activeRequest = lastRequest;

	return changed;
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