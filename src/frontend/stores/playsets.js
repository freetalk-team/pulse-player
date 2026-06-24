import { writable, get } from 'svelte/store';

import { activeEditPlayset, isEditMode } from './selection';

export const playsets = writable([]);
export const playsetCount = writable(0);

export const activePlayset = writable(null);

export async function loadPlaysets(count) {
	const data = await api.getPlaysets();
	playsets.set(data);

	playsetCount.set(count);
}

export async function createPlayset(name) {
	const id = await api.createPlayset(name);
	// Refresh list
	loadPlaysets();
}

export async function addMemberToPlayset(playsetId, member) {
	// member = { id: 1, type: 'playlist', start: '09:00', end: '11:00' }
	await api.addPlaysetMember(playsetId, member);
	
	loadPlaysets();
}

export async function editPlayset(playset) {
	// 1. Fetch tracks if they aren't already loaded (to populate the workbench)
	// if (!playlists.tracks || playlist.tracks.length === 0) {
	// 	const tracks = await api.getPlaylistTracks(playlist.id);
	// 	playlist.tracks = tracks;
	// }

	// const layout = get(currentLayout);

	// if (layout == 'home') {
	// 	homeEditPlaylist.set(playlist);
	// }
	// else {
	// 	activeEditPlaylist.set(playlist);
	// 	isEditMode.set(true);

	// }

	if (!playset.members) {
		playset.members = await api.getPlaysetMembers(playset.id);
	}

	activeEditPlayset.set(playset);
	isEditMode.set(true);
}

export function deletePlayset(playset) {

}

export function playPlayset(playset) {

}

export function renamePlayset(playsetId, name) {

}
