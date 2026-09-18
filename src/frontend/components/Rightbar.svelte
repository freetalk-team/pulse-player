<script>

import { tooltip } from '../actions.js';

import { queue, queueSets, recent, currentTrack, playTrack } from '../stores/play';
import { editMode, activeEditPlayset, activeEditPlaylist } from '../stores/selection';
import { createPlaylistFromRecent } from '../stores/library.js';
import { editTrack } from '../stores/tracks.js';

import List from './ui/List.svelte';
import ListFlex from './ui/ListFlex.svelte';
import Card from './rightbar/Card.svelte';
import EditTrack from './rightbar/EditTrack.svelte';
import Workbench from './rightbar/Workbench.svelte';
import PlaysetWorkbench from './rightbar/PlaysetWorkbench.svelte';
import TrackItem from './rightbar/TrackItem.svelte';
import SetItem from './rightbar/SetItem.svelte';

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
		window.api.setPref('ui.rightbarWidth', width);
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

	<div class="auto-hide-scrollbar overflow-y-auto p-2 flex flex-col h-full">

		{#if $editMode}
			<!-- Use a wrapper that allows the content to scroll -->
			<div class="flex flex-col flex-grow">

				{#if $activeEditPlaylist}
			
					<div class="flex items-center gap-2 mb-2 mt-4 px-2">
						<i class="fa-solid fa-pen-to-square text-pulse-accent text-xs"></i>
						<span class="text-xs font-bold uppercase tracking-widest text-gray-400 truncate">
							Editing: {$activeEditPlaylist.name || 'New Playlist'}
						</span>
					</div>

					<div class="flex flex-col flex-grow">
						<Workbench />
					</div>
				{:else if $activeEditPlayset}
					<div class="flex items-center gap-2 mb-2 mt-4 px-2">
						<i class="fa-solid fa-pen-to-square text-pulse-accent text-xs"></i>
						<span class="text-xs font-bold uppercase tracking-widest text-gray-400 truncate">
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
				ItemComponent={TrackItem}
				title="Queue" 
				icon="fa-layer-group" 
				iconColor="text-purple-500"
				items={queue}
				onSelect={item => playTrack(item, true)}
				reorder={true}
				visibleItems={10}
				showEmpty={"Queue is empty"}
			>
				{#snippet actions()}
					<button 
						class="text-red-400 hover:text-red-500 transition-colors"
						aria-label="Clear"
						use:tooltip={"Clear"}
						on:click={() => queue.set([])}
					>
						<i class="fa-solid fa-xmark text-xs"></i>
					</button>
				{/snippet}
				
				{#snippet head()}
					{#if $queueSets.length > 0}
						<div class="p-1 mb-2 mt-1 rounded-lg bg-pulse-white/2 border border-pulse-white/5">
							<List 
								ItemComponent={SetItem}
								items={queueSets}
								reorder={true}
							>
								{#snippet itemActions(item, ctx)}
									<button 
										aria-label="Move up"
										class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
										class:hidden={ctx.first()}
										on:click={() => ctx.up()}
										use:tooltip={"Up"}
									>
										<i class="fa-solid fa-chevron-up text-[9px]"></i>
									</button>
									
									<!-- Move Down -->
									<button 
										aria-label="Move down"
										class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
										class:hidden={ctx.last()}
										on:click={() => ctx.down()}
										use:tooltip={"Down"}
									>
										<i class="fa-solid fa-chevron-down text-[9px]"></i>
									</button>
									<button 
										aria-label="Remove"
										on:click={() => ctx.rm()}
										use:tooltip={"Remove"}
										class="text-red-500"
									>
										<i class="fa-solid fa-remove text-[10px]"></i>
									</button>
								{/snippet}
							</List>
						</div>
					{/if}
				{/snippet}

				{#snippet itemActions(item, ctx)}
				
					<button 
						aria-label="Move up"
						class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
						class:hidden={ctx.first()}
						on:click={() => ctx.up()}
						use:tooltip={"Up"}
					>
						<i class="fa-solid fa-chevron-up text-[9px]"></i>
					</button>
					
					<!-- Move Down -->
					<button 
						aria-label="Move down"
						class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
						class:hidden={ctx.last()}
						on:click={() => ctx.down()}
						use:tooltip={"Down"}
					>
						<i class="fa-solid fa-chevron-down text-[9px]"></i>
					</button>
					<button 
						aria-label="Remove"
						on:click={() => ctx.rm()}
						use:tooltip={"Remove"}
						class="text-red-500"
					>
						<i class="fa-solid fa-remove text-[10px]"></i>
					</button>
				{/snippet}
			</ListFlex>

			<ListFlex
				ItemComponent={TrackItem}
				title="Recent" 
				icon="fa-list-ol" 
				iconColor="text-orange-500" 
				items={recent}
				onSelect={playTrack}
				visibleItems={20}
				hideEmpty={true}
			>
				{#snippet actions()}
					<button 
						on:click={createPlaylistFromRecent}
						class="text-orange-400 hover:orange-red-500 transition-colors"
						aria-label="New playlist"
						use:tooltip={"New playlist"}
					>
						<i class="fa-solid fa-list-ul text-xs"></i>
					</button>
					<button 
						on:click={() => recent.set([])}
						class="text-red-400 hover:text-red-500 transition-colors"
						aria-label="Clear"
						use:tooltip={"Clear"}
					>
						<i class="fa-solid fa-xmark text-xs"></i>
					</button>
				{/snippet}
				{#snippet itemActions(item, ctx)}
					<button 
						aria-label="Remove"
						use:tooltip={"Remove"}
						class="text-red-500"
						on:click={() => ctx.rm()}
					>
						<i class="fa-solid fa-remove text-[10px]"></i>
					</button>
				{/snippet}
				{#snippet contextMenu(item, menu)}
					<button on:click={menu.execute(playTrack)} class="menu-item">
						<i class="fa-solid fa-play text-pulse-accent"></i>
						<span>Play</span>
					</button>

					<div class="h-px bg-white/5 my-1"></div>

					<button on:click={menu.remove()} class="menu-item hover:text-red-500">
						<i class="fa-solid fa-remove text-red-400"></i>
						<span>Remove</span>
					</button>

				{/snippet}
			</ListFlex>
		{/if}
	</div>
</aside>
