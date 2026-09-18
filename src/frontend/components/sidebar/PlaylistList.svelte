<script>

import { onMount } from 'svelte';

import { tooltip } from '../../actions.js';

import { selectPlaylist, selectedPlaylist } from '../../stores/player.js';
import { top, loadPlaylists, createPlaylist, deletePlaylist, playPlaylist, editPlaylist, renamePlaylist, addTrackToPlaylist } from '../../stores/playlist';

import ListFlex from '../ui/ListFlex.svelte';
import PlaylistItem from './PlaylistItem.svelte';

let isCreatingPlaylist = false;

onMount(() => {
	loadPlaylists();
});

function onAddPlaylist(name) {
	isCreatingPlaylist = false;
	createPlaylist(name, null, true);
}

function handlePlaylistCreateClick() {
	isCreatingPlaylist = !isCreatingPlaylist;
}

</script>

<ListFlex
	ItemComponent={PlaylistItem}
	title="Playlists"
	icon="fa-list-ul" 
	iconColor="text-orange-300"
	items={top}
	selectedItem={$selectedPlaylist}
	bind:canAdd={isCreatingPlaylist}
	dropAccept={'tracks'}
	onSelect={(item, index) => selectPlaylist(item)}
	onDrop={addTrackToPlaylist}
	onNew={onAddPlaylist}
	visibleItems={6}
	onRename={(item, name) => renamePlaylist(item.id, name)}
>
	{#snippet actions()}
		{#if !isCreatingPlaylist}
            <button 
                on:click={handlePlaylistCreateClick}
                class="text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
                use:tooltip={"New playlist"}
            >
                <i class="fa-solid fa-plus text-xs"></i>
            </button>
        {/if}
	{/snippet}
	{#snippet contextMenu(item, menu)}
		<button on:click={menu.execute(playPlaylist)} class="menu-item">
			<i class="fa-solid fa-play text-pulse-accent"></i>
			<span>Play All</span>
		</button>
		
		{#if platform.import}
			<button on:click={handleAddFolder} class="menu-item">
				<i class="fa-solid fa-folder-plus text-blue-400"></i>
				<span>Add Folder</span>
			</button>
		{/if}

		<div class="h-px bg-white/5 my-1"></div>

		<button on:click={menu.rename()} class="menu-item">
			<i class="fa-solid fa-pen text-orange-400"></i>
			<span>Rename</span>
		</button>

		<button on:click={menu.execute(editPlaylist)} class="menu-item">
			<i class="fa-solid fa-pen-to-square text-orange-400"></i>
			<span>Edit Playlist</span>
		</button>

		<button on:click={menu.execute(deletePlaylist)} class="menu-item hover:text-red-500">
			<i class="fa-solid fa-trash-can text-red-400"></i>
			<span>Delete</span>
		</button>

	{/snippet}

	{#snippet itemActions(item)}
		<button class="text-pulse-accent hover:scale-110 transition-transform leading-none" 
			aria-label="Play all"
			on:click={() => playPlaylist(item)}
			use:tooltip={"Play all"}
		>
			<i class="fa-solid fa-circle-play text-xs"></i>
		</button>
		<button class="text-gray-500 hover:text-orange-500 transition-colors leading-none"
			aria-label="Edit"
			on:click={() => editPlaylist(item)}
			use:tooltip={"Edit"}
		>
			<i class="fa-solid fa-pen-to-square text-[10px]"></i>
		</button>
		<button class="text-gray-500 hover:text-red-500 transition-colors leading-none"
			aria-label="Delete"
			on:click={() => deletePlaylist(item)}
			use:tooltip={"Delete"}
		>
			<i class="fa-solid fa-trash-can text-[10px]"></i>
		</button>
	{/snippet}
</ListFlex>
