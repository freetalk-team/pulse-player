
import { writable, get } from 'svelte/store';

import { randomIcon, randomColor } from '../components/ui/icons';

import { activeOrder, editMode, searchQuery, activeEditPlaylist, activeEditPlayset, activeEditPlaylistTracks } from './selection';
import { selectFilter, selectedFilter, selectedPlaylist } from './player';
import { playlistCount } from './library';
import { collections } from './collections';
import { setTracks } from './tracks';
import { confirmAction } from './ui';
import { enqueueTracks, playSet } from './play';
import { fetchCall } from './fetch';

export const top = writable([]);
export const playlists = writable([]);
export const tracks = writable([]);

export const isLoading = writable(false);
export const hasMore = writable(false);

export const playlistPreviews = writable({});

const queryPlaylists = fetchCall(api.queryPlaylists, playlists, isLoading, hasMore, buildQuery);
export const fetch = (reset) => queryPlaylists({}, reset);

let lastUpdatedPlaylist;
let loaded = false;

api.on('playlist:added', playlist => {
	playlistCount.update(n => n + 1);
	top.update(list => [playlist, ...list]);

	if (['playlists', 'collections'].includes(get(selectedFilter))) {
		collections.update(list => [playlist, ...list]); // check match query!
	}

	report.success(`Playlist added: '${playlist.name}'`);
});

activeEditPlaylistTracks.subscribe((tracks, reorder) => {
	const id = get(activeEditPlaylist)?.id;
	if (!id) return;

	//console.debug('Active edit playlist update');

	if (!reorder)
		updatePlaylistStat(id, tracks);

	updatePlaylistOrder(id, tracks);
});

export async function loadPlaylists() {
	if (loaded) return;

	const all = await api.getPlaylists();
	top.set(all);

	loaded = true;
}

export async function createPlaylist(name, tracks=[], edit=false, select=false) {

	if (!tracks)
		tracks = [];

	const icon = `${randomIcon()} ${randomColor()}`;
	const id = await api.createPlaylist({ name, tracks, icon });
	if (!id) {
		report.error('Failed to create playlist');
		return null;
	} 

	const playlist = { id, name, icon, type: 'playlist',
		track_count: tracks.length, 
		total_rating: tracks.map(i => i.rating).sum(), 
		total_duration: tracks.map(i => i.duration).sum()
	};

	// console.debug('New playlist:', playlist);

	top.update(list => [playlist, ...list]);
	playlists.update(list => [playlist, ...list]);
	playlistCount.update(n => n + 1);

	if (edit) {
		activeEditPlaylist.set(playlist);
		activeEditPlaylistTracks.value = tracks;

		editMode.set('playlist');
	}

	if (select)
		selectedPlaylist.set(playlist);

	report.success('Playlist created');
	
	return playlist;
}

export async function editPlaylist(playlist) {

	if (!playlist)
		playlist = get(selectedPlaylist);

	const playlistId = playlist.id;

	//const id = typeof playlist == 'object' ? playlist.id : playlist;
	const tracks = await api.getPlaylistTracks(playlistId);

	lastUpdatedPlaylist = { id: playlistId, tracks };

	// 1. Fetch tracks if they aren't already loaded (to populate the workbench)
	// if (!playlist.tracks || playlist.tracks.length === 0)
	// 	playlist.tracks = await api.getPlaylistTracks(playlist.id);

	console.debug('Editing playlist:', playlist, tracks.length);

	activeEditPlayset.set(null);
	activeEditPlaylist.set(playlist);
	activeEditPlaylistTracks.value = tracks;

	editMode.set('playlist');
}

export async function deletePlaylist(playlist) {

	const selected = get(selectedPlaylist);
	const activeEdit = get(activeEditPlaylist);

	if (!playlist) 
		playlist = selected;

	const confirmed = await confirmAction({
		title: 'Delete Playlist?',
		message: `This will permanently remove "${playlist.name}". Your music files won't be touched.`,
		confirmText: 'Delete',
		danger: true
	});

	if (confirmed) {
		await api.deletePlaylist(playlist.id);

		//selectFilter('all');

		top.update(list => list.filter(p => p.id !== playlist.id));
		playlists.update(list => list.filter(p => p.id !== playlist.id));
		collections.update(list => list.filter(p => !(p.type == 'playlist' && p.id == playlist.id)));

		playlistCount.update(n => n - 1);

		if (playlist.id == selected?.id) {
			selectFilter('all');
		}

		if (playlist.id == activeEdit?.id) {
			editMode.set(false);
			activeEditPlaylist.set(null);
		}
	}

}

export async function playPlaylist(playlist, force) {

	if (!playlist) 
		playlist = get(selectedPlaylist);

	playSet(playlist, force);
}

export async function addTrackToPlaylist(playlist, track) {

	//console.debug('Add track to playlist');

	const selected = get(selectedPlaylist);
	const active = get(activeEditPlaylist);

	// console.debug('Add tracks:', playlist);
	// console.debug('Selected:', selected);
	// console.debug('Active:', active);

	let currentTracks, isActive = false;

	if (!playlist) {
		playlist = active;
	}

	const playlistId = playlist.id;

	if (playlistId == active?.id) {
		isActive = true;
		currentTracks = activeEditPlaylistTracks.value;
	}
	else {
		if (playlistId == lastUpdatedPlaylist?.id) {
			currentTracks = lastUpdatedPlaylist.tracks;
		}
		else {
			currentTracks = await api.getPlaylistTracks(playlistId);
			lastUpdatedPlaylist = { id: playlistId, tracks: currentTracks };
		}
	}

	const tracks = (Array.isArray(track) ? track : [track])
		.filter(i => !currentTracks.find(m => m.id === i.id));

	if (tracks.length == 0) return;

	let position = currentTracks.length;

	if (isActive) 
		activeEditPlaylistTracks.add(tracks);

	const data = {
		track_count: playlist.track_count + tracks.length,
		total_rating: playlist.total_rating + tracks.map(i => i.rating).sum(),
		total_duration: playlist.total_duration + tracks.map(i => i.duration).sum()
	};

	console.debug('Updating playlist:', data);

	updateStores(playlistId, data, isActive);

	await updatePlaylistOrder(playlistId, tracks, currentTracks.length);

	currentTracks.push(...tracks);

}

async function updatePlaylistOrder(playlistId, newTracks, startIndex=-1) {
    await api.updatePlaylistOrder(playlistId, newTracks, startIndex);
}

export async function renamePlaylist(id, newName, updateActive=true) {
	const data = { name: newName };

	updateStores(id, data, updateActive);

	await api.updatePlaylist(id, data);
}

export async function updatePlaylistMetadata(playlist) {
    if (!playlist || !playlist.id) return;

	const id = playlist.id;
	const data = {
		name: playlist.name,
		icon: playlist.icon,
		genre: playlist.genre || 'Various'
	};

    updateStores(id, data);

    await api.updatePlaylist(id, data);
}

function updatePlaylistStat(id, tracks) {

	const data = {
		track_count: tracks.length,
		total_rating: tracks.map(i => i.rating).sum(),
		total_duration: tracks.map(i => i.duration).sum()
	};

	updateStores(id, data);
}

function updateStores(id, data, updateActive) {
	top.update(list => list.map(p => p.id === id ? { ...p, ...data } : p));
    playlists.update(list => list.map(p => p.id === id ? { ...p, ...data } : p));
    collections.update(list => list.map(p => p.type == 'playlist' && p.id === id ? { ...p, ...data } : p));

	// 2. Update Workbench if it's the active one
	if (updateActive) 
		activeEditPlaylist.update(p => p && p.id === id ? { ...p, ...data } : p);
}

export function clearPlaylists() {
	top.set([]);
	playlists.set([]);
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

async function playRemotePlaylist(playlist) {
	const tracks = await api.getPlaylistTracks(playlist.id, playlist.remote);
	enqueueTracks(tracks);
}