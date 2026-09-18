<script>

import { selectedAlbum, selectedFilter, selectedPlaylist, selectedPlayset } from '../stores/player';
import { currentRadio, currentTrack } from '../stores/play';
import { currentLayout } from '../stores/ui';

import Player from './header/Player.svelte';
import Seek from './header/Seek.svelte';
import Visualizer from './header/Visualizer.svelte';
import SleepTimer from './header/SleepTimer.svelte';

import TrackHeader from './header/TrackHeader.svelte';
import RadioHeader from './header/RadioHeader.svelte';
import IdleHeader from './header/IdleHeader.svelte';
import Actions from './header/Actions.svelte';

// onMount(async () => {
// 	// 1. Sync slider with real system volume on boot
// 	volume = await window.api.ipcRenderer.invoke('volume:get');
// });

// // 2. Reactively update system volume when slider moves
// // We use a throttle or a simple check to avoid flooding the system
// $: if (window.api?.ipcRenderer) {
// 	window.api.ipcRenderer.send('volume:set', volume);
// }

$: collection = $selectedPlaylist || $selectedAlbum || $selectedPlayset;

$: extraStyles = $currentLayout === 'home'
	? 'm-2 rounded-xl'
	: 'rounded-bl-md';

</script>

<header class="header h-[115px] p-4 select-none z-30 {extraStyles}">
	<div class="header-grid h-full w-full">

		<!-- AREA: icon with GLOW -->
		<!-- <div class="area-icon relative flex items-center justify-center">
		{#if $selectedAlbum?.cover_path}
			<div class="absolute inset-0 bg-pulse-accent/30 blur-xl rounded-full animate-pulse"></div>
			<img 
			src="media://{$selectedAlbum.cover_path}" 
			class="relative w-12 h-12 rounded-md object-cover shadow-2xl border border-white/10" 
			alt="" 
			/>
		{:else}
			<i class="fa-solid fa-compact-disc text-3xl text-pulse-accent"></i>
		{/if}
		</div> -->

		{#if $currentTrack}
			<TrackHeader filter={$selectedFilter} track={$currentTrack} album={$selectedAlbum} />
		{:else if $currentRadio}
			<RadioHeader station={$currentRadio} />
		{:else}
			<IdleHeader filter={$selectedFilter} {collection} />
		{/if}

		<div class="area-progress flex items-center gap-2">
			<Seek />
			<!-- The Visualizer -->
			<Visualizer />
		</div>

		<div class="area-right flex flex-col items-end justify-center gap-1">
			<Player />
		</div>

		<!-- AREA: tbar (With added top padding for alignment) -->
		<div class="area-tbar pt-2.5 flex items-center gap-5 justify-end opacity-40 hover:opacity-100 transition-all duration-300">
			{#if $currentLayout == 'player'}
				<Actions collection={$selectedFilter} />
			{/if}
			<SleepTimer />
		</div>

	</div>
</header>

<style>

@reference "../assets/main.css";

.header {
	@apply relative
		bg-[rgba(255,255,255,0.08)]
		border-b
		border-b-[rgba(255,255,255,0.1)]
		shadow-[0_30px_60px_rgba(0,0,0,0.95)]
		rounded-bl-lg;
}

.header::after {
	content: '';
	@apply absolute
		-bottom-5
		left-0
		right-0
		h-5
		bg-[linear-gradient(to_bottom,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.12)_40%,transparent_100%)]
		pointer-events-none;
}

:global(.light-theme) .header {
	@apply bg-[rgba(180,180,180,0.6)]
		border-b-[rgba(0,0,0,0.1)]
		shadow-[0_30px_60px_rgba(0,0,0,0.15)];
}

:global(.light-theme) .header::after {
	@apply bg-[linear-gradient(to_bottom,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.03)_40%,transparent_100%)];
}

.header-grid {
	display: grid;
	/* 1fr for title area will now respect 'min-width: 0' */
	grid-template-columns: 70px minmax(0, 1fr) minmax(145px, 600px);
	grid-template-rows: 1fr 1fr 1fr;
	column-gap: 20px;
	grid-template-areas:
		"icon title right"
		"icon desc  right"
		"icon progress tbar";
}

.area-progress { grid-area: progress; }
.area-right { grid-area: right; }
.area-tbar { grid-area: tbar; }

/* Buttons */

.state-btn {
	@apply text-sm text-gray-500 hover:text-pulse-accent transition-colors;
}
.tbar-btn {
	@apply text-lg text-gray-500 transition-colors;
}

/* .header::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1px;

	background: rgba(255,255,255,0.25);
}

*/

</style>
