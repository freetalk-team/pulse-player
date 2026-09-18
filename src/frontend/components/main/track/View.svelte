<script>

import { onMount } from "svelte";
import { get } from 'svelte/store';

import { tracks, fetch, isLoading, hasMore } from '../../../stores/tracks';
import { searchQuery, activeOrder, editMode } from '../../../stores/selection';
import { currentLayout } from "../../../stores/ui";

import Grid from '../GridSelect.svelte';
import Card from './Card.svelte';

export let filter; // store
export let playlist; // store

$: isEditing = $editMode == 'playlist';
$: canDnd = isEditing || $currentLayout == 'player';

let playlistId;

const fetchTracks = (reset) => fetch({ playlist: playlistId, filter: get(filter) }, reset);

onMount(() => {

	let initialized = false;

	const unsubscribeSearch = searchQuery.subscribe(v => {
		if (!initialized) return;
		fetchTracks(true);
	});

	const unsubscribeOrder = activeOrder.subscribe(v => {
		if (!initialized) return;
		fetchTracks(true);
	});

	initialized = true;

	const unsubscribePlaylist = playlist
		? playlist.subscribe(v => {
			playlistId = v?.id;
			if (v) {
				fetchTracks(true);
			}
		})
		: () => {};

	const unsubscribeFilter = filter.subscribe(v => {
		if (['audio', 'video', 'all'].includes(v)) {
			playlistId = null;
			fetchTracks(true);
		}
	});
	
	return () => {
		unsubscribeSearch();
		unsubscribeOrder();
		unsubscribePlaylist();
		unsubscribeFilter();
	}
	
});


</script>

<Grid 
	items={$tracks}
	component={Card} 
	componentProps={{ isEditing, canDnd }}
	fetch={fetchTracks}
	isLoading={$isLoading} 
	hasMore={$hasMore}
	dndType={'tracks'}
/>