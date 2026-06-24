<script>

import { debounce } from 'lodash'; // Recommended to avoid spamming the DB
import { flip } from 'svelte/animate';

import { tooltip } from '../../actions';

import { addTrackToPlaylist, activeEditPlaylist, activeEditPlaylistTracks } from '../../stores/playlist';

import Header from './WorkbenchHeader.svelte';
import TrackItem from './TrackItem.svelte';
import ListFlex from '../ui/ListFlex.svelte';

function handleDragOver(e) {

	// console.log('Drag over event:', e.dataTransfer.types);

	// Allow the drop if it's an internal track FROM MAIN
	if (e.dataTransfer.types.includes('pulse/tracks')) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	} 
	// Allow the drop if it's a REORDER drag
	else if (e.dataTransfer.types.includes('pulse/index')) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
	}
}

function handleDrop(e) {
	e.preventDefault();
	e.stopPropagation();

	const trackData = e.dataTransfer.getData('pulse/tracks');

	if (trackData) {
		// CASE 1: Adding new track from Main
		const tracks = JSON.parse(trackData);
		addTracks(tracks);
	} 
}

function addTracks(tracks) {
	addTrackToPlaylist(null, tracks);
}

</script>

<div
	role="region"
	on:dragover={handleDragOver}
	on:drop={handleDrop}
	class="flex flex-col grow rounded-lg p-2 border-2 border-dashed 
	{$activeEditPlaylistTracks.length === 0 ? 'border-pulse-accent/30 py-10' : 'border-transparent' } 
	transition-colors min-h-[200px]"
>
	<Header />
	{#if $activeEditPlaylistTracks.length > 0}

		<ListFlex
			items={activeEditPlaylistTracks}
			reorder={true}
			visibleItems={1000}
			itemComponent={TrackItem}
		>
			<div slot="item_actions"
				class="gap-1 flex items-center"
				let:item let:index let:count let:move let:remove 
			>
				<button 
					aria-label="Move up"
					class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
					disabled={index === 0}
					on:click|stopPropagation={() => move(index, -1)}
					use:tooltip={"Up"}
				>
					<i class="fa-solid fa-chevron-up text-[9px]"></i>
				</button>
				
				<!-- Move Down -->
				<button 
					aria-label="Move down"
					class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
					disabled={index === count - 1}
					on:click|stopPropagation={() => move(index, 1)}
					use:tooltip={"Down"}
				>
					<i class="fa-solid fa-chevron-down text-[9px]"></i>
				</button>
				<button 
					aria-label="Remove"
					class="text-red-500"
					on:click|stopPropagation={() => remove(index)}
					use:tooltip={"Remove"}
				>
					<i class="fa-solid fa-remove text-[10px]"></i>
				</button>
			</div>
		</ListFlex>

	{:else}
		<div class="py-10 text-center pointer-events-none bg-white/5">
			<i class="fa-solid fa-plus-circle text-gray-700 text-xl mb-2"></i>
			<p class="text-[10px] text-gray-600 italic">Drop tracks here</p>
		</div>
	{/if}
</div>
