import { writable, derived } from 'svelte/store';

export const editPlaylist = writable(null);
export const activeTab = writable('all');

export const collection = derived(
	activeTab,
	(id) => {
		switch (id) {
			case 'sets':
			return ['album', 'playlist'];

			case 'all':
			case null:
			return null;

			default:
			return id;
		}
	}
);