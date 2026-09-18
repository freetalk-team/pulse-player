<script>

import { onMount } from 'svelte';

import { tooltip } from '../../actions.js';

import { selectPlayset, selectedPlayset } from '../../stores/player.js';
import { top, loadPlaysets, createPlayset, renamePlayset, playPlayset, editPlayset, deletePlayset, addMemberToPlayset } from '../../stores/playsets';

import ListFlex from '../ui/ListFlex.svelte';
import PlaysetItem from './PlaysetItem.svelte';

let isCreatingPlayset = false;
let newPlaysetName = "";

onMount(() => {
	loadPlaysets();
});

function onAddPlayset(name) {
	isCreatingPlayset = false;
	createPlayset(name, null, true);
}

function handlePlaysetCreateClick() {
	isCreatingPlayset = true;
	newPlaysetName = "";
}

function handlePlaysetDrop(playset, item, type) {
	item.type = item.type || type;
	addMemberToPlayset(playset, item);
}

</script>

<ListFlex
	ItemComponent={PlaysetItem}
	title="Playsets"
	icon="fa-sliders" 
	iconColor="text-blue-300"
	items={top}
	selectedItem={$selectedPlayset}
	bind:canAdd={isCreatingPlayset}
	dropAccept={['playlist','album','set']}
	onSelect={(item, index) => selectPlayset(item)}
	onDrop={handlePlaysetDrop}
	onNew={onAddPlayset}
	visibleItems={6}
	onRename={(item, name) => renamePlayset(item.id, name)}
>
	{#snippet actions()}
        {#if !isCreatingPlayset}
            <button 
                on:click={handlePlaysetCreateClick}
                class="text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
                use:tooltip={"New playset"}
            >
                <i class="fa-solid fa-plus text-xs"></i>
            </button>
        {/if}
	{/snippet}
	{#snippet contextMenu(item, menu)}
		<button on:click={menu.execute(playPlayset)} class="menu-item">
			<i class="fa-solid fa-play text-pulse-accent"></i>
			<span>Play All</span>
		</button>

		<div class="h-px bg-white/5 my-1"></div>

		<button on:click={menu.rename()} class="menu-item">
			<i class="fa-solid fa-pen text-orange-400"></i>
			<span>Rename</span>
		</button>

		<button on:click={menu.execute(editPlayset)} class="menu-item">
			<i class="fa-solid fa-pen-to-square text-orange-400"></i>
			<span>Edit Playlist</span>
		</button>

		<button on:click={menu.execute(deletePlayset)} class="menu-item hover:text-red-500">
			<i class="fa-solid fa-trash-can text-red-400"></i>
			<span>Delete</span>
		</button>
	{/snippet}
	{#snippet itemActions(item)}
		<button class="text-pulse-accent hover:scale-110 transition-transform leading-none" 
			aria-label="Play all"
			on:click={() => playPlayset(item)}
			use:tooltip={"Play all"}
		>
			<i class="fa-solid fa-circle-play text-xs"></i>
		</button>
		<button class="text-gray-500 hover:text-orange-500 transition-colors leading-none"
			aria-label="Edit"
			on:click={() => editPlayset(item)}
			use:tooltip={"Edit"}
		>
			<i class="fa-solid fa-pen-to-square text-[10px]"></i>
		</button>
		<button class="text-gray-500 hover:text-red-500 transition-colors leading-none"
			aria-label="Delete"
			on:click={() => deletePlayset(item)}
			use:tooltip={"Delete"}
		>
			<i class="fa-solid fa-trash-can text-[10px]"></i>
		</button>
	{/snippet}
</ListFlex>
