<script>

import { tooltip } from '../../actions';

import { deletePlaylist, editPlaylist, playPlaylist } from '../../stores/playlist';
import { deleteAlbum, playAlbum } from '../../stores/albums';

export let collection;

</script>

{#if collection === 'playlist'}
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
{:else if collection === 'album'}
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