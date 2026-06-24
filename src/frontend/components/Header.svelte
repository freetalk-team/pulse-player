<script>

import { tooltip } from '../actions';
import { formatDescription } from '../utils/format';

import { selectedAlbum, selectedFilter, selectedPlaylist, selectedPlayset } from '../stores/player';
import { deletePlaylist, editPlaylist, playPlaylist } from '../stores/playlist';
import { audioCount, videoCount } from '../stores/tracks';
import { deleteAlbum, playAlbum } from '../stores/library'
import { currentTrack } from '../stores/play';
import { currentLayout } from '../stores/ui';

import Player from './header/Player.svelte';
import Seek from './header/Seek.svelte';
import Visualizer from './header/Visualizer.svelte';
import SleepTimer from './header/SleepTimer.svelte';
import Title from './header/Title.svelte';

// onMount(async () => {
// 	// 1. Sync slider with real system volume on boot
// 	volume = await window.api.ipcRenderer.invoke('volume:get');
// });

// // 2. Reactively update system volume when slider moves
// // We use a throttle or a simple check to avoid flooding the system
// $: if (window.api?.ipcRenderer) {
// 	window.api.ipcRenderer.send('volume:set', volume);
// }

$: extraStyles = $currentLayout === 'home'
	? 'm-2 rounded-xl'
	: 'rounded-bl-md';

$: description = (() => {

	if ($currentTrack)
		return formatDescription($currentTrack);

	switch ($selectedFilter) {
		case 'all':
			return `${$audioCount + $videoCount} tracks`;

		case 'audio':
			return `${$audioCount} tracks`;

		case 'video':
			return `${$videoCount} tracks`;

		default: {
			const collection =
				$selectedPlaylist ||
				$selectedAlbum ||
				$selectedPlayset;

			return `${collection?.track_count ?? 0} tracks`;
		}
	}
})();

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
	
		<!-- AREA: icon -->
		<div class="area-icon flex items-center justify-center overflow-hidden rounded-lg shadow-lg bg-black/40 w-14 h-14 border border-white/5">
		{#if $selectedAlbum}
			{#if $selectedAlbum.cover_path}
				<img src="{platform.resolve($selectedAlbum.cover_path)}" class="w-full h-full object-cover" alt="" />
			{:else}
				<i class="fa-solid text-2xl fa-compact-disc text-pulse-accent"></i>
			{/if}
		{:else if $selectedFilter === 'playlist'}
			<i class="fa-solid text-2xl fa-bars-staggered text-orange-500 text-pulse-accent"></i>
		{:else}
			<i class="fa-solid text-2xl
				{$selectedFilter === 'audio' ? 'fa-music text-blue-400' : 
				$selectedFilter === 'video' ? 'fa-film text-purple-400' : 
				'fa-icons text-pulse-accent'}"></i>
		{/if}
		</div>

		<!-- AREA: title -->
		<div class="area-title flex items-end pb-1 min-w-0">
			<!-- <h2 class="text-xl font-black truncate tracking-tighter uppercase opacity-95 text-white">Media</h2> -->
			{#if $currentTrack}
				<h2 class="font-display italic text-2xl font-black truncate leading-tight">
					{$currentTrack.title}
				</h2>
			{:else}
				<Title />
			{/if}
		</div>

		<!-- AREA: desc -->
		<div class="area-desc flex items-start min-w-0 mt-1">
			{#if $currentTrack}
				<p class="text-[10px] text-pulse-accent uppercase tracking-widest font-bold opacity-80 truncate">
					{description}
				</p>
			{:else}
				<p class="text-[10px] uppercase tracking-widest italic opacity-80 truncate">
					{description}
				</p>
			{/if}
			<!-- <span class="text-xs italic text-gray-500 truncate tracking-wide">Extinction Blues</span> -->
		</div>

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

			{#if $selectedFilter === 'playlist'}
				<div class="flex items-center gap-3">
					<!-- Play Button -->
					<button 
						on:click={() => playPlaylist()}
						class="flex items-center gap-2 px-4 py-1 bg-pulse-accent text-black rounded-full font-bold hover:scale-105 transition-transform"
					>
						<i class="fa-solid fa-play text-[10px]"></i>
						<span class="text-xs">Play All</span>
					</button>

					<button 
						on:click={() => editPlaylist()}
						aria-label="Edit"
						use:tooltip={"Edit"}
						class="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-orange-500/20 text-gray-400 hover:text-orange-500 rounded-full transition-all"
					>
						<i class="fa-solid fa-pen-to-square text-xs"></i>
					</button>

					<!-- Delete Button -->
					<button 
						on:click={() => deletePlaylist()}
						aria-label="Delete"
						use:tooltip={"Delete"}
						class="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition-all"
					>
						<i class="fa-solid fa-trash-can text-xs"></i>
					</button>
				</div>
			{:else if $selectedFilter === 'album'}
				<div class="flex items-center gap-3">
					<!-- Play Button -->
					<button 
						on:click={() => playAlbum()}
						class="flex items-center gap-2 px-4 py-1 bg-pulse-accent text-black rounded-full font-bold hover:scale-105 transition-transform"
					>
						<i class="fa-solid fa-play text-[10px]"></i>
						<span class="text-xs">Play All</span>
					</button>

					<!-- Delete Button -->
					<button 
						on:click={() => deleteAlbum()}
						aria-label="Delete"
						use:tooltip={"Delete"}
						class="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition-all"
					>
						<i class="fa-solid fa-trash-can text-xs"></i>
					</button>
				</div>
			{/if}

			<SleepTimer />
		</div>

	</div>
</header>

<style>

@reference "../assets/main.css";

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

.area-icon { grid-area: icon; }
.area-title { grid-area: title; }
.area-desc { grid-area: desc; }
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



.header {
	position: relative;
	background: var(--header-bg);
	border-bottom: 1px solid var(--header-border);
	box-shadow: var(--header-shadow);
	border-bottom-left-radius: 0.5rem;
}

.header::after {
	content: '';
	position: absolute;
	bottom: -20px;
	left: 0;
	right: 0;
	height: 20px;
	background: var(--header-falloff);
	pointer-events: none;
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

.theme-light .header::before {
	background: rgba(255,255,255,0.7);
} */

</style>
