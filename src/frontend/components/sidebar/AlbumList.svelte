<script>

import { onMount } from 'svelte';

import { tooltip } from '../../actions.js';

import { selectAlbum, selectedAlbum } from '../../stores/player';
import { top as albums, loadAlbums, playAlbum, deleteAlbum  } from '../../stores/albums';

import ListFlex from '../ui/ListFlex.svelte';
import AlbumItem from './AlbumItem.svelte';

onMount(() => {
	loadAlbums();
});

</script>


<ListFlex
	ItemComponent={AlbumItem}
	title="Albums" 
	icon="fa-compact-disc" 
	iconColor="text-purple-300"
	items={albums}
	selectedItem={$selectedAlbum}
	onSelect={(item, index) => selectAlbum(item)}
	visibleItems={6}
	hideEmpty={true}
>
	{#snippet contextMenu(item, actions)}
        <button on:click={actions.execute(playAlbum)} class="menu-item">
			<i class="fa-solid fa-play text-pulse-accent"></i>
			<span>Play All</span>
		</button>

		<div class="h-px bg-white/5 my-1"></div>

		<button on:click={actions.execute(deleteAlbum)} class="menu-item hover:text-red-500">
			<i class="fa-solid fa-trash-can text-red-400"></i>
			<span>Delete</span>
		</button>
    {/snippet}

	{#snippet itemActions(item)}
		<button class="text-pulse-accent hover:scale-110 transition-transform leading-none" 
			aria-label="Play all"
			on:click={() => playAlbum(item)}
			use:tooltip={"Play all"}
		>
			<i class="fa-solid fa-circle-play text-xs"></i>
		</button>
		
		<button class="text-gray-500 hover:text-red-500 transition-colors leading-none"
			aria-label="Delete"
			on:click={() => deleteAlbum(item)}
			use:tooltip={"Delete"}
		>
			<i class="fa-solid fa-trash-can text-[10px]"></i>
		</button>
    {/snippet}
</ListFlex>