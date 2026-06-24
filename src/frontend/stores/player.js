import { writable, get, derived } from 'svelte/store';

import { sleep } from '../utils/sleep';

import { isLoading } from './ui';

export const selectedAlbum = writable(null);
export const selectedPlaylist = writable(null);
export const selectedPlayset = writable(null);
export const selectedFilter = writable('all'); // 'all', 'audio', or 'video'

export function selectFilter(type) {
	// console.log('Set selected filter:', type);

	selectedAlbum.set(null);
	selectedPlaylist.set(null);
	selectedPlayset.set(null);

	selectedFilter.set(type);
};

export async function selectAlbum(album) {
	const currentFilter = get(selectedFilter);

	if (currentFilter === 'album') {

		const current = get(selectedAlbum);

		if (album.id == current?.id)
			return;
	}

	// isEditMode.set(false);

	selectedPlaylist.set(null);
	// activeEditPlaylist.set(null);

	selectedAlbum.set(album);
	selectedFilter.set('album');
};

export async function selectPlaylist(playlist) {
	const currentFilter = get(selectedFilter);

	if (currentFilter == 'playlist') {

		const currentPlaylist = get(selectedPlaylist);

		if (playlist.id == currentPlaylist?.id)
			return;
	}

	// isEditMode.set(false);

	// activeEditPlaylist.set(null);
	selectedAlbum.set(null);
	selectedPlayset.set(null);

	selectedPlaylist.set(playlist);
	selectedFilter.set('playlist');
}

export function selectPlayset(playset) {
	
	selectedAlbum.set(null);
	selectedPlaylist.set(null);

	selectedPlayset.set(playset);

	selectedFilter.set('playset');
}

export const showSearch = derived(
	selectedFilter,
	($selectedFilter) => $selectedFilter !== 'album'
);

