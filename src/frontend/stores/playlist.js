
import { writable, get } from 'svelte/store';

import {  activeOrder, isEditMode, searchQuery } from './selection';
import { selectFilter, selectedFilter, selectedPlaylist } from './player';
import { editPlaylist as homeEditPlaylist } from './home';
import { currentLayout, confirmAction } from './ui';
import { enqueueTracks } from './play';

export const playlists = writable([]);
export const playlistCount = writable(0);

export const activeEditPlaylist = writable(null);
export const activeEditPlaylistTracks = writable([]);
export const playlistPreviews = writable({});

let isEditing = false;
let activeEditPlaylistTracksCount = 0;





export async function loadPlaylists(count) {
	const data = await api.getPlaylists();
	playlists.set(data);

	playlistCount.set(count);

	isEditMode.subscribe(v => isEditing = v);

	activeEditPlaylist.subscribe(playlist => {
		if (!isEditing) return;

		updatePlaylistMetadata(playlist);
	});

	activeEditPlaylistTracks.subscribe(tracks => {
		if (!isEditing) return;

		const id = get(activeEditPlaylist).id;
		const purge = tracks.length < activeEditPlaylistTracksCount;
		const updateStat = tracks.length != activeEditPlaylistTracksCount;

		activeEditPlaylistTracksCount = tracks.length;

		if (updateStat)
			updatePlaylistStat(id, tracks);

		updatePlaylistOrder(id, tracks, purge);
	});
}

export async function loadPlaylistPreviews() {
	const previews = await api.loadPlaylistPreviews();
	playlistPreviews.set(previews);
}


export async function createPlaylist(name, tracks=[], edit=false) {

	if (!tracks) {
		
		tracks = await api.getTracks({ 
			query: get(searchQuery), 
			filter: get(selectedFilter), 
			sort: get(activeOrder), 
			offset: 0, 
			limit: 100
		});

	}

	const id = await api.savePlaylist({ name, tracks });
	const playlist = { id, name, 
		track_count: tracks.length, 
		total_rating: tracks.map(i => i.rating).sum(), 
		total_duration: tracks.map(i => i.duration).sum()
	};

	playlists.update(list => [playlist, ...list]);

	if (edit) {
		activeEditPlaylistTracksCount = tracks.length;

		activeEditPlaylist.set(playlist);
		activeEditPlaylistTracks.set(tracks);

		isEditMode.set(true);
	}
	
	return id;
}

export async function editPlaylist(playlist) {

	if (!playlist)
		playlist = get(selectedPlaylist);

	//const id = typeof playlist == 'object' ? playlist.id : playlist;
	const tracks = await api.getPlaylistTracks(playlist.id);

	// 1. Fetch tracks if they aren't already loaded (to populate the workbench)
	// if (!playlist.tracks || playlist.tracks.length === 0)
	// 	playlist.tracks = await api.getPlaylistTracks(playlist.id);

	const layout = get(currentLayout);

	if (layout == 'home') {
		homeEditPlaylist.set({ ...playlist, tracks });
	}
	else {

		activeEditPlaylistTracksCount = tracks.length;

		activeEditPlaylist.set(playlist);
		activeEditPlaylistTracks.set(tracks);

		isEditMode.set(true);
	}
}

export async function deletePlaylist(playlist) {

	if (!playlist) 
		playlist = get(selectedPlaylist);

	const confirmed = await confirmAction({
		title: 'Delete Playlist?',
		message: `This will permanently remove "${playlist.name}". Your music files won't be touched.`,
		confirmText: 'Delete',
		danger: true
	});

	if (confirmed) {
		// Only now do we call the SQLite delete
		await api.deletePlaylist(playlist.id);

		selectFilter('all');

		playlists.update(list => list.filter(p => p.id !== playlist.id));
	}

}

export async function renamePlaylist(id, newName) {
	// 1. Optimistic Update
	playlists.update(list => list.map(p => 
		p.id === id ? { ...p, name: newName } : p
	));

	// 2. Update Workbench if it's the active one
	activeEditPlaylist.update(pl => {
		if (pl && pl.id === id) return { ...pl, name: newName };
		return pl;
	});

	// 3. Persist to DB
	await api.renamePlaylist(id, newName);
}

export async function playPlaylist(playlist) {
	if (!playlist) playlist = get(selectedPlaylist);

	const tracks = await api.getPlaylistTracks(playlist.id);

	if (!tracks || tracks.length === 0) return;

	await api.updateLastPlayedPlaylist(playlist.id);

	enqueueTracks(tracks);
}


export async function addTrackToPlaylist(playlistId, track) {

	const isActiveEditPlaylist = !playlistId;

	let currentTracks;

	if (isActiveEditPlaylist) {
		currentTracks = get(activeEditPlaylistTracks);
	}
	else {
		if (typeof playlistId == 'object')
			playlistId = playlistId.id;

		const allPlaylists = get(playlists);
		const targetPlaylist = allPlaylists.find(p => p.id === playlistId);

		if (targetPlaylist) {

			if (!targetPlaylist.tracks) 
				targetPlaylist.tracks = await api.getPlaylistTracks(playlistId);

			currentTracks = targetPlaylist.tracks
		}
	}
	
	// 1. Get the current list of playlists

	const tracks = (Array.isArray(track) ? track : [track])
		.filter(i => !currentTracks.find(t => t.path === i.path));

	let position = currentTracks.length;

	for (const track of tracks)
		track.position = position++;
	
	const updatedTracks = [...currentTracks, ...tracks];


	if (isActiveEditPlaylist) {
		activeEditPlaylistTracks.set(updatedTracks);
	}
	else {

		await api.updatePlaylistOrder(playlistId, tracks);

		updatePlaylistStat(playlistId, updatedTracks);
	}

}

export function updatePlaylistTracks(playlistId, newTracks) {
	playlists.update(list => list.map(p => {
		if (p.id === playlistId) {
			// Update the count for the sidebar badge
			return { ...p, tracks: newTracks, track_count: newTracks.length };
		}
		return p;
	}));

	// Persist to DB (Debounced in the component or here)
	api.savePlaylist({ 
		id: playlistId, 
		tracks: newTracks.map(t => ({ id: t.id })) // Only need IDs for the link table
	});
}

export async function updatePlaylistOrder(playlist, tracks, purge=false) {

	const id = playlist ? (typeof playlist == 'object' ? playlist.id : playlist) : get(activeEditPlaylist).id;

    // 1. Prepare the data for the main process
    const orderData = tracks.map((track, index) => ({
        track_id: track.id,
        position: index
    }));

	

    // 2. Call IPC to update SQLite
    await api.updatePlaylistOrder(id, orderData, purge);

    // 3. Update the local store so the sidebar/previews react
    // playlists.update(list => list.map(p => 
    //     p.id === playlistId ? { ...p, tracks } : p
    // ));
}

export async function updatePlaylistMetadata(playlist) {
    if (!playlist || !playlist.id) return;

    // 1. Update the local playlists store (Optimistic UI)
    playlists.update(list => list.map(p => 
        p.id === playlist.id 
            ? { ...p, icon: playlist.icon, icon_color: playlist.icon_color, genre: playlist.genre } 
            : p
    ));

    // 2. Persist to SQLite
    await api.updatePlaylistMetadata({
        id: playlist.id,
        icon: playlist.icon || 'fa-music',
        icon_color: playlist.icon_color || 'text-pulse-accent',
        genre: playlist.genre || 'Various'
    });
}

function updatePlaylistStat(id, tracks) {
	playlists.update(list => list.map(p => 
		p.id === id 
			? { ...p, 
				tracks: tracks, 
				track_count: tracks.length,
				total_rting: tracks.map(i => i.rating).sum(),
				total_duration: tracks.map(i => i.duration).sum(),
			  } 
			: p
	));
}

