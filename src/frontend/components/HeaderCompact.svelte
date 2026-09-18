<script>

import { selectedAlbum, selectedFilter, selectedPlaylist, selectedPlayset } from '../stores/player';
import { currentRadio, currentTrack } from '../stores/play';

import Player from './header/PlayerCompact.svelte';

import TrackHeader from './header/TrackHeader.svelte';
import RadioHeader from './header/RadioHeader.svelte';
import IdleHeader from './header/IdleHeader.svelte';

$: collection = $selectedPlaylist || $selectedAlbum || $selectedPlayset;


</script>

<header class="flex p-4 select-none z-30 bg-[rgba(255,255,255,0.08)]
		border-b
		border-b-[rgba(255,255,255,0.1)]
		shadow-[0_30px_60px_rgba(0,0,0,0.95)]">


	{#if $currentTrack}
		<TrackHeader filter={$selectedFilter} track={$currentTrack} album={$selectedAlbum} />
	{:else if $currentRadio}
		<RadioHeader station={$currentRadio} />
	{:else}
		<IdleHeader filter={$selectedFilter} {collection} />
	{/if}

	<Player />
	
</header>

<style>

@reference "../assets/main.css";

header {
	display: grid;
	/* 1fr for title area will now respect 'min-width: 0' */
	/* grid-template-columns: 70px minmax(0, 1fr) minmax(145px, 600px); */
	/* grid-template-rows: 1fr 1fr 1fr; */
	column-gap: 20px;
	grid-template-areas:
		"icon title right"
		"icon desc  right";
}

</style>
