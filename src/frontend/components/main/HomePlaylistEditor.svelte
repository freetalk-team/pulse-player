<script>

import { dndzone } from 'svelte-dnd-action';
import { flip } from 'svelte/animate';

import { scrollHover } from '../../actions';

import { updatePlaylistOrder } from '../../stores/playlist';

import IconPicker from '../ui/IconPicker.svelte';
import IconColor from '../ui/IconColor.svelte';
import GenreSelect from '../ui/GenreSelect.svelte';
import TrackItem from './EditTrackItem.svelte';

export let playlist;
export let close;

const flipDurationMs = 300;

// 1. Handle the "Consider" event (while dragging)
function handleDndConsider(e) {
	playlist.tracks = e.detail.items;
}

// 2. Handle the "Finalize" event (after dropping)
async function handleDndFinalize(e) {
	playlist.tracks = e.detail.items;
	// Sync new order to SQLite
	await updatePlaylistOrder(playlist.id, playlist.tracks);
}

</script>

<div class="flex flex-col h-full p-8">
	<!-- Top Nav: Back to Grid -->
	<div class="flex items-center gap-4 mb-8">
		<!-- <button on:click={close} class="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white">
			<i class="fa-solid fa-arrow-left text-lg"></i>
		</button> -->
		<h1 class="flex-grow text-3xl font-black uppercase tracking-wider text-white/40">Editing Playlist</h1>
		<button 
			on:click={close}
			class="flex items-center gap-2 px-4 py-1 bg-pulse-accent text-black rounded-full font-bold hover:scale-105 transition-transform"
		>
			<i class="fa-solid fa-chevron-left"></i>
			<span class="text-sm uppercase tracking-wider">Finish Editing</span>
		</button>
	</div>

	<div class="flex gap-12 flex-grow">
		<!-- LEFT: Metadata (Fixed width) -->
		<div class="w-80 flex flex-col gap-6 flex-shrink-0 p-2">
			<div class="aspect-square bg-black/40 rounded-2xl overflow-hidden border border-white/5">
				<!-- Use the 2x2 preview or a large icon here -->
				<div class="w-full h-full flex items-center justify-center">
					<i class="fa-solid {playlist.icon} text-6xl {playlist.icon_color}"></i>
				</div>
			</div>

			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<label class="text-[10px] uppercase font-bold text-gray-500">Name</label>
					<input bind:value={playlist.name} class="bg-white/5 p-3 rounded-lg outline-none focus:ring-1 ring-pulse-accent/50 transition-all" />
				</div>

				<div class="flex flex-col gap-3 relative z-50">
					<div class="flex flex-col gap-1">
						<label class="text-[10px] uppercase font-bold text-gray-500">Genre</label>
						<GenreSelect bind:value={playlist.genre} placement={"top"} />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-[10px] uppercase font-bold text-gray-500">Icon</label>
						<IconPicker bind:value={playlist.icon} color={playlist.icon_color} placement={"top"} />
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-[10px] uppercase font-bold text-gray-500">Icon Color</label>
						<IconColor bind:value={playlist.icon_color} />
					</div>
				</div>
			</div>
		</div>

		<!-- RIGHT: Tracklist (Scrollable) -->
		<div class="flex-grow flex flex-col min-w-0 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
			<div class="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
				<span class="text-xs font-bold text-gray-400">{playlist.track_count} Tracks</span>
				<!-- <button class="text-[10px] font-bold text-pulse-accent hover:underline">REORDER ALL</button> -->
			</div>

			<div class="flex-grow p-4 custom-scroll overflow-y-auto"
				use:scrollHover
				use:dndzone={{items: playlist.tracks, flipDurationMs}} 
				on:consider={handleDndConsider} 
				on:finalize={handleDndFinalize}
			>
				{#each playlist.tracks as track, i (track.id)}
					<!-- Apply the 'Lift' classes here -->
					<div 
						class="flex rounded-xl transition-all duration-200 outline-none
							aria-pressed:bg-white/10 aria-pressed:scale-[1.02] aria-pressed:shadow-2xl aria-pressed:z-50" 
						animate:flip={{ duration: 300 }}
					>
						<TrackItem {track} index={i + 1} />
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
