<script>

import { onMount } from 'svelte';

import { fade, fly } from 'svelte/transition';

import { closeContextMenu, renamingId } from '../stores/ui';
import { playPlaylist, deletePlaylist, editPlaylist } from '../stores/playlist';
import { activeEditPlaylist, isEditMode } from '../stores/selection';

export let x;
export let y;
export let playlist;

let current = playlist;

onMount(() => {
	const handleBlur = () => closeContextMenu();
	window.addEventListener('blur', handleBlur);

	return () => window.removeEventListener('blur', handleBlur);
});

async function handleAddFolder() {

	closeContextMenu();

	const paths = await api.dialogOpenDirectory();

	if (paths?.length > 0) {
		// Reuse your existing folder scanning logic here
		api.scanFolders(paths, current.id);
	}
}

function handleDelete() {
	closeContextMenu();
	deletePlaylist(current);
}

function handlePlay() {
	closeContextMenu();
	playPlaylist(current);
}

function handleRename() {
	closeContextMenu();
	renamingId.set(current.id); // Trigger the input in the sidebar
}

async function handleEdit() {
	closeContextMenu();
	editPlaylist(current);
}

</script>


<div 
	role="menu"
	tabindex="0"
	transition:fly={{ y: 5, duration: 150 }}
	on:mousedown|stopPropagation 
	on:contextmenu|preventDefault|stopPropagation
	class="fixed z-100 w-48 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl py-1 overflow-hidden"
	style="top: {y}px; left: {x}px;"
>
	<button on:click={handlePlay} class="menu-item">
		<i class="fa-solid fa-play text-pulse-accent"></i>
		<span>Play All</span>
	</button>
	
	<button on:click={handleAddFolder} class="menu-item">
		<i class="fa-solid fa-folder-plus text-blue-400"></i>
		<span>Add Folder</span>
	</button>

	<div class="h-px bg-white/5 my-1"></div>

	<button on:click={handleRename} class="menu-item">
		<i class="fa-solid fa-pen text-orange-400"></i>
		<span>Rename</span>
	</button>

	<button on:click={handleEdit} class="menu-item">
		<i class="fa-solid fa-pen-to-square text-pulse-accent"></i>
		<span>Edit Playlist</span>
	</button>

	<button on:click={handleDelete} class="menu-item hover:text-red-500">
		<i class="fa-solid fa-trash-can text-red-400"></i>
		<span>Delete</span>
	</button>
</div>

<style>

@reference "../assets/main.css";

.menu-item {
	@apply w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-left;
}

</style>
