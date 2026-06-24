<script>

import { onMount } from 'svelte';
import { slide } from 'svelte/transition';
import { flip } from 'svelte/animate';

import { scrollHover, tooltip } from '../actions.js';

import { queue, recent, currentTrack, playTrack } from '../stores/play';
import { isEditMode, activeEditPlayset } from '../stores/selection';
import { activeEditPlaylist } from '../stores/playlist.js';
import { createPlaylistFromRecent } from '../stores/library.js';
import { editTrack } from '../stores/tracks.js';

import ListFlex from './ui/ListFlex2.svelte';
import Card from './rightbar/Card.svelte';
import EditTrack from './rightbar/EditTrack.svelte';
import Workbench from './rightbar/Workbench.svelte';
import PlaysetWorkbench from './rightbar/PlaysetWorkbench.svelte';
import TrackItem from './rightbar/TrackItem.svelte';

// Use 'export' to allow App.svelte to pass these in
export let width;

let isResizing = false;

function onMouseMove(e) {
	if (!isResizing) return;

	width = Math.min(Math.max(200, window.innerWidth - e.clientX), 400);
}

function stopResizing() {
	if (!isResizing) return;

	isResizing = false;

	// Save the new widths
	if (window.isElectron) {
		window.api.setPref('rightbarWidth', width);
	} else {
		localStorage.setItem('rightbarWidth', width);
	}
}

</script>

<svelte:window 
	on:mousemove={onMouseMove} 
	on:mouseup={stopResizing}
/>

<aside
	style="width: {width}px"
	class="bg-pulse-bg relative flex flex-col flex-shrink-0 overflow-hidden {!isResizing ? 'transition-all duration-500 ease-in-out' : ''}"
>
	<div 
		on:mousedown={() => isResizing = true } 
		class="resizer-container -left-[6px] {isResizing ? 'resizing-active' : ''}"
	>
		<div class="v-sash"></div>
	</div>

	<div use:scrollHover class="custom-scroll overflow-y-auto p-2 flex flex-col h-full">

		{#if $isEditMode}
			<!-- Use a wrapper that allows the content to scroll -->
			<div class="flex flex-col flex-grow">

				{#if $activeEditPlaylist}
			
					<div class="flex items-center gap-2 mb-2 mt-4 px-2 flex-shrink-0">
						<i class="fa-solid fa-pen-to-square text-pulse-accent text-xs"></i>
						<span class="text-xs font-bold uppercase tracking-widest text-gray-400">
							Editing: {$activeEditPlaylist.name || 'New Playlist'}
						</span>
					</div>

					<div class="flex flex-col flex-grow">
						<Workbench />
					</div>
				{:else if $activeEditPlayset}
					<div class="flex items-center gap-2 mb-2 mt-4 px-2 flex-shrink-0">
						<i class="fa-solid fa-pen-to-square text-pulse-accent text-xs"></i>
						<span class="text-xs font-bold uppercase tracking-widest text-gray-400">
							Editing: {$activeEditPlayset.name || 'New Playset'}
						</span>
					</div>

					<div class="flex flex-col flex-grow">
						<PlaysetWorkbench />
					</div>
				{/if}
			</div>
		{:else}
			{#if $editTrack}
				<div class="flex-shrink-0"> <!-- Prevent the card from being squished -->
					<EditTrack track={$editTrack} />
				</div>
			{:else if $currentTrack}
				<div class="flex-shrink-0"> <!-- Prevent the card from being squished -->
					<Card track={$currentTrack} />
				</div>
			{/if}

			<ListFlex
				title="Queue" 
				icon="fa-layer-group" 
				iconColor="text-purple-500"
				items={queue}
				onSelect={item => playTrack(item, true)}
				reorder={true}
				visibleItems={10}
				itemComponent={TrackItem}
				showEmpty={"Queue is empty"}
			>
				<div slot="actions">
					<button 
						class="text-red-400 w-4 h-4 hover:text-red-500 transition-colors cursor-pointer"
						aria-label="Clear"
						use:tooltip={"Clear"}
						on:click={() => queue.set([])}
					>
						<i class="fa-solid fa-xmark text-xs"></i>
					</button>
				</div>
				<div slot="item_actions"
					class="gap-1 flex items-center"
					let:index let:count let:move let:remove
					on:click|stopPropagation
				>
					<button 
						aria-label="Move up"
						class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
						disabled={index === 0}
						on:click={() => move(index, -1)}
						use:tooltip={"Up"}
					>
						<i class="fa-solid fa-chevron-up text-[9px]"></i>
					</button>
					
					<!-- Move Down -->
					<button 
						aria-label="Move down"
						class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
						disabled={index === count - 1}
						on:click={() => move(index, 1)}
						use:tooltip={"Down"}
					>
						<i class="fa-solid fa-chevron-down text-[9px]"></i>
					</button>
					<button 
						aria-label="Remove"
						on:click={() => remove(index)}
						use:tooltip={"Remove"}
						class="text-red-500"
					>
						<i class="fa-solid fa-remove text-[10px]"></i>
					</button>
				</div>
			</ListFlex>

			<ListFlex
				title="Recent" 
				icon="fa-list-ol" 
				iconColor="text-orange-500" 
				items={recent}
				onSelect={playTrack}
				visibleItems={20}
				itemComponent={TrackItem}
				hideEmpty={true}
			>
				<div slot="actions" class="gap-2 flex items-center">
					<button 
						on:click={createPlaylistFromRecent}
						class="text-orange-400 hover:orange-red-500 transition-colors cursor-pointer"
						aria-label="New playlist"
						use:tooltip={"New playlist"}
					>
						<i class="fa-solid fa-list-ul text-xs"></i>
					</button>
					<button 
						on:click={() => recent.set([])}
						class="text-red-400 hover:text-red-500 transition-colors cursor-pointer"
						aria-label="Clear"
						use:tooltip={"Clear"}
					>
						<i class="fa-solid fa-xmark text-xs"></i>
					</button>
				</div>
				<div 
					slot="item_actions" 
					class="gap-2 flex items-center"
					let:index let:remove
					on:click|stopPropagation
				>
					<button 
						aria-label="Remove"
						use:tooltip={"Remove"}
						class="text-red-500"
						on:click={() => remove(index)}
					>
						<i class="fa-solid fa-remove text-[10px]"></i>
					</button>
				</div>
			</ListFlex>
		{/if}
	</div>
</aside>
