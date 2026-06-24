import { writable, get, derived } from 'svelte/store';

import { selectedAlbum, selectedFilter, selectedPlaylist } from './player';
import { isVideoView } from './play';


// Stores the currently selected album object
export const activeOrder = writable('rating');
export const searchQuery = writable("");
export const isEditMode = writable(false);
export const activeEditPlaylist = writable(null); // Holds the playlist object being edited
export const activeEditPlayset = writable(null);
export const selectedTracks = writable([]); // For the "Select Mode" / Batch 
export const isTheaterMode = writable(false);


export const selectedTrackIds = writable(new Set());
export const lastSelectedId = writable(null);

isVideoView.subscribe(v => {
	if (!v) isTheaterMode.set(false);
});

export function toggleTrackSelection(trackId, isCtrl, isShift, tracks) {


	selectedTrackIds.update(set => {
		const newSet = new Set(set);

		if (isShift && get(lastSelectedId)) {
			// RANGE SELECTION (Shift + Click)
			const lastIdx = tracks.findIndex(t => t.id === get(lastSelectedId));
			const currentIdx = tracks.findIndex(t => t.id === trackId);
			
			const start = Math.min(lastIdx, currentIdx);
			const end = Math.max(lastIdx, currentIdx);
			
			// Select everything in the range
			tracks.slice(start, end + 1).forEach(t => newSet.add(t.id));
		} else if (isCtrl) {
			// INDIVIDUAL TOGGLE (Ctrl/Cmd + Click)
			if (newSet.has(trackId)) newSet.delete(trackId);
			else newSet.add(trackId);
			lastSelectedId.set(trackId);
		} else {
			// SINGLE SELECTION (Regular Click)
			newSet.clear();
			newSet.add(trackId);
			lastSelectedId.set(trackId);
		}
		
		return newSet;
	});
}

export function clearSelection() {
	selectedTrackIds.set(new Set());
	lastSelectedId.set(null);
}

// Automatically determine layout based on selection
export const viewMode = derived(selectedAlbum, $album => $album ? 'list' : 'grid');

// This store will hold the filtered results
// export const filteredTracks = derived(
// 	[searchQuery, currentTracks],
// 	([$query, $tracks]) => {
// 		if (!$query) return $tracks;
// 		// You can also call your IPC 'db:search-tracks' here for global search
// 		return $tracks.filter(t => 
// 			t.title.toLowerCase().includes($query.toLowerCase()) ||
// 			t.artist?.toLowerCase().includes($query.toLowerCase())
// 		);
// 	}
// );



export function getTracksQuery() {
	return {
		query: get(searchQuery),
		filter: get(selectedFilter),
		sort: get(activeOrder),
		playlistId: get(selectedPlaylist)?.id,
	}
}

export function getSetsQuery() {
	return {
		query: get(searchQuery),
		sort: get(activeOrder),
		// playlistId: get(selectedPlayset)?.id,
	}
}