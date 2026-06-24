<script>

import { tooltip } from '../../actions.js';

import { albums, albumCount, playAlbum, deleteAlbum } from '../../stores/library';
import { audioCount, videoCount } from '../../stores/tracks.js';
import { playlists, playlistCount, createPlaylist, deletePlaylist, playPlaylist, editPlaylist, renamePlaylist, addTrackToPlaylist } from '../../stores/playlist';
import { playsets, playsetCount, createPlayset, renamePlayset, playPlayset, editPlayset, deletePlayset } from '../../stores/playsets';
import { selectFilter, selectedFilter, selectAlbum, selectedAlbum, selectedPlaylist, selectPlaylist, selectedPlayset, selectPlayset } from '../../stores/player';

import PlaylistItem from './PlaylistItem.svelte';
import AlbumItem from './AlbumItem.svelte';
import FilterItem from './FilterItem.svelte';

import List from '../ui/List.svelte';
import ListFlex from '../ui/ListFlex.svelte';

let isCreatingPlayset = false;
let newPlaysetName = "";

let isCreatingPlaylist = false;
let newPlaylistName = "";


function handlePlaysetCreateClick() {
	isCreatingPlayset = true;
	newPlaysetName = "";
}


function handlePlaylistCreateClick() {
	isCreatingPlaylist = !isCreatingPlaylist;
	newPlaylistName = "";
}

function handlePlaysetKeydown(e) {
	if (e.key === 'Enter') savePlayset();
	if (e.key === 'Escape') isCreatingPlayset = false;
}

function handlePlaylistKeydown(e) {
	if (e.key === 'Enter') savePlaylist();
	if (e.key === 'Escape') isCreatingPlaylist = false;
}

async function savePlayset() {
	
}

async function savePlaylist() {
	if (newPlaylistName.trim() !== "") {
		// This now handles the store update AND the DB call
		await createPlaylist(newPlaylistName, [], true);
	}

	isCreatingPlaylist = false;
	newPlaylistName = "";
}

async function handlePlaysetDrop(item, dt) {
	
}

function handleAddFolder() {

}

function onAddPlaylist(name) {
	isCreatingPlaylist = false;
	createPlaylist(name);
}

function onAddPlayset(name) {
	isCreatingPlayset = false;
	createPlayset(name);
}

function handleImport() {

}

$: library = [
	{
		filter: 'all',
		title: 'All media',
		icon: 'fa-icons',
		count: $audioCount + $videoCount
	},
	{
		filter: 'audio',
		title: 'Audio Tracks',
		icon: 'fa-music',
		iconColor: 'text-blue-400',
		count: $audioCount
	},
	{
		filter: 'video',
		title: 'Video Clips',
		icon: 'fa-film',
		iconColor: 'text-purple-400',
		count: $videoCount
	},
	{
		filter: 'playsets',
		title: 'Playsets',
		icon: 'fa-sliders',
		iconColor: 'text-blue-400',
		count: $playsetCount
	},
	{
		filter: 'playlists',
		title: 'Playlists',
		icon: 'fa-bars-staggered',
		iconColor: 'text-orange-400',
		count: $playlistCount
	},
	{
		filter: 'albums',
		title: 'Albums',
		icon: 'fa-compact-disc',
		iconColor: 'text-purple-400',
		count: $albumCount
	},
	{
		filter: 'sets',
		title: 'Collections',
		icon: 'fa-layer-group',
		iconColor: 'text-rose-400',
		count: $albumCount + $playlistCount
	},
	
];

</script>

<List 
	title="Library" 
	icon="fa-book-open" 
>
	{#each library as item}
		<FilterItem 
			{item} 
			isSelected={$selectedFilter == item.filter}
			onSelect={() => selectFilter(item.filter)}
		/>
	{/each}
</List>

<ListFlex
	title="Playsets"
	icon="fa-sliders" 
	iconColor="text-blue-500"
	items={playsets}
	itemComponent={PlaylistItem}
	selectedItem={selectedPlayset}
	canAdd={false}
	dropAccept={'sets'}
	onSelect={(item, index) => selectPlayset(item)}
	onDrop={(item, data) => handlePlaysetDrop(item, data)}
	onNew={onAddPlayset}
	visibleItems={6}
	onRename={(item, name) => renamePlayset(item.id, name)}
>
	<div slot="actions">
		<button 
			on:click={handlePlaysetCreateClick}
			class="text-gray-500 w-4 h-4 hover:text-orange-500 transition-colors cursor-pointer"
			use:tooltip={"New playset"}
		>
			<i class="fa-solid fa-plus text-xs"></i>
		</button>
	</div>
	<div slot="context_menu" let:execute let:rename>
		<button on:click={execute(playPlayset)} class="menu-item">
			<i class="fa-solid fa-play text-pulse-accent"></i>
			<span>Play All</span>
		</button>

		<div class="h-px bg-white/5 my-1"></div>

		<button on:click={rename()} class="menu-item">
			<i class="fa-solid fa-pen text-orange-400"></i>
			<span>Rename</span>
		</button>

		<button on:click={execute(editPlayset)} class="menu-item">
			<i class="fa-solid fa-pen-to-square text-pulse-accent"></i>
			<span>Edit Playlist</span>
		</button>

		<button on:click={execute(deletePlayset)} class="menu-item hover:text-red-500">
			<i class="fa-solid fa-trash-can text-red-400"></i>
			<span>Delete</span>
		</button>
	</div>
	<div slot="item_actions" let:item class="gap-2 flex items-center">
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
	</div>
</ListFlex>

<ListFlex
	title="Playlists"
	icon="fa-bars-staggered" 
	iconColor="text-orange-500"
	items={playlists}
	itemComponent={PlaylistItem}
	selectedItem={selectedPlaylist}
	canAdd={isCreatingPlaylist}
	dropAccept={'tracks'}
	onSelect={(item, index) => selectPlaylist(item)}
	onDrop={addTrackToPlaylist}
	onNew={onAddPlaylist}
	visibleItems={6}
	onRename={(item, name) => renamePlaylist(item.id, name)}
>
	<div slot="actions">
		<button 
			on:click={handlePlaylistCreateClick}
			class="text-gray-500 w-4 h-4 hover:text-orange-500 transition-colors cursor-pointer"
			use:tooltip={"New playlist"}
		>
			<i class="fa-solid fa-plus text-xs"></i>
		</button>
	</div>
	<div slot="context_menu" let:item let:execute let:rename>
		<button on:click={execute(playPlaylist)} class="menu-item">
			<i class="fa-solid fa-play text-pulse-accent"></i>
			<span>Play All</span>
		</button>
		
		{#if !(platform.remote && item.remote)}

			{#if platform.import}
				<button on:click={handleAddFolder} class="menu-item">
					<i class="fa-solid fa-folder-plus text-blue-400"></i>
					<span>Add Folder</span>
				</button>
			{/if}

			<div class="h-px bg-white/5 my-1"></div>

			<button on:click={rename()} class="menu-item">
				<i class="fa-solid fa-pen text-orange-400"></i>
				<span>Rename</span>
			</button>

			<button on:click={execute(editPlaylist)} class="menu-item">
				<i class="fa-solid fa-pen-to-square text-pulse-accent"></i>
				<span>Edit Playlist</span>
			</button>

			<button on:click={execute(deletePlaylist)} class="menu-item hover:text-red-500">
				<i class="fa-solid fa-trash-can text-red-400"></i>
				<span>Delete</span>
			</button>

		{/if}
	</div>
	<div slot="item_actions" let:item class="gap-2 flex items-center">
		<button class="text-pulse-accent hover:scale-110 transition-transform leading-none" 
			aria-label="Play all"
			on:click={() => playPlaylist(item)}
			use:tooltip={"Play all"}
		>
			<i class="fa-solid fa-circle-play text-xs"></i>
		</button>

		{#if !(platform.remote && item.remote)}
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
		{/if}
	</div>
</ListFlex>

<ListFlex
	title="Albums" 
	icon="fa-compact-disc" 
	iconColor="text-purple-500"
	items={albums}
	itemComponent={AlbumItem}
	selectedItem={selectedAlbum}
	onSelect={(item, index) => selectAlbum(item)}
	visibleItems={6}
	hideEmpty={true}
>
	<div slot="context_menu" let:execute let:rename>
		<button on:click={execute(playAlbum)} class="menu-item">
			<i class="fa-solid fa-play text-pulse-accent"></i>
			<span>Play All</span>
		</button>

		{#if !platform.remote}

			<div class="h-px bg-white/5 my-1"></div>

			<button on:click={execute(deleteAlbum)} class="menu-item hover:text-red-500">
				<i class="fa-solid fa-trash-can text-red-400"></i>
				<span>Delete</span>
			</button>
		{/if}
	</div>
	<div slot="item_actions" let:item class="gap-2 flex items-center">
		<button class="text-pulse-accent hover:scale-110 transition-transform leading-none" 
			aria-label="Play all"
			on:click={() => playAlbum(item)}
			use:tooltip={"Play all"}
		>
			<i class="fa-solid fa-circle-play text-xs"></i>
		</button>
		
		{#if !platform.remote}
			<button class="text-gray-500 hover:text-red-500 transition-colors leading-none"
				aria-label="Delete"
				on:click={() => deleteAlbum(item)}
				use:tooltip={"Delete"}
			>
				<i class="fa-solid fa-trash-can text-[10px]"></i>
			</button>
		{/if}
	</div>
</ListFlex>