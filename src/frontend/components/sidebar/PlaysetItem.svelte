<script>

import { tooltip } from '../../actions';

import { renamingId } from '../../stores/ui';
import { selectedPlaylist, selectPlaylist } from '../../stores/player';
import { playPlayset, deletePlayset, editPlayset, renamePlayset } from '../../stores/playsets';

import Stat from './Stat.svelte';
import Rating from './Rating.svelte';

export let playset;

let editName = playset.name;

let isOver = false;
let showSuccess = false;

async function handleDrop(e) {
	const data = e.dataTransfer.getData('pulse/tracks');
		
	if (data) {
		e.preventDefault();

		isOver = false;

		const tracks = JSON.parse(data);

		// await addTrackToPlaylist(playlist.id, tracks);

		onDropShowSuccess();
	}
}

function onDropShowSuccess() {
	showSuccess = true;
	setTimeout(() => { showSuccess = false; }, 2000);
}

// Auto-focus the input when it appears
function focusInput(node) {
	node.focus();
	node.select();
}

async function handleSave() {
	if (editName.trim() !== "" && editName !== playset.name) {
		await renamePlayset(playset.id, editName);
	}
	renamingId.set(null);
}

function handleKey(e) {
	if (e.key === 'Enter') handleSave();
	if (e.key === 'Escape') {
		editName = playset.name; // Revert
		renamingId.set(null);
	}
}

</script>


<div
	role="button" tabindex="0"
	on:contextmenu|preventDefault|stopPropagation
	on:dragover|preventDefault={() => isOver = true}
	on:dragleave={() => isOver = false}
	on:drop={handleDrop}
	on:click={() => selectPlaylist(playset)}
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPlaylist(playset)}
	class="group/item relative flex flex-col p-2 rounded-md transition-all select-none mb-1 cursor-pointer
		{isOver ? 'bg-pulse-accent/15 ring-1 ring-inset ring-pulse-accent/30 scale-[1.02]' : ''} 
		{$selectedPlaylist?.id === playset.id ? 'bg-white/10 border-l-2 border-pulse-accent' : 'hover:bg-white/5'}"
>
	<!-- TOP ROW: Title & Dynamic Right Side -->
	<div class="flex items-center justify-between mb-1">
		{#if $renamingId === playset.id}
			<!-- RENAME INPUT -->
			<input 
				use:focusInput
				bind:value={editName}
				on:blur={handleSave}
				on:keydown={handleKey}
				on:click|stopPropagation
				class="bg-white/10 border-none outline-none text-sm text-white rounded px-1 w-full"
			/>
		{:else}
			<h4 class="text-sm font-semibold truncate transition-colors {$selectedPlaylist?.id === playset.id ? '' : 'group-hover/item:text-text-main/60'}">
				<i class="fa-solid mr-2 {playset.icon || 'fa-music'} text-[14px] {playset.icon_color || 'text-pulse-accent'}"></i>
				{playset.name}
			</h4>
		{/if}

		<!-- ... inside the top row ... -->
		<div class="flex items-center justify-end min-w-[50px] h-5"> <!-- ADDED h-5 (20px) -->
			{#if showSuccess}
				<!-- Success Checkmark -->
				<div class="relative flex items-center justify-center w-full h-full">
					<span class="absolute w-4 h-4 bg-green-500/40 rounded-full animate-ping"></span>
					<i class="fa-solid fa-check text-green-400 text-[10px]"></i>
				</div>
			{:else}
				<!-- The container that swaps -->
				<div class="flex items-center justify-end w-full h-full gap-2">
					<!-- HOVER BUTTONS -->
					<div class="hidden group-hover/item:flex items-center gap-2 pr-1 h-full">
						<button 
							aria-label="Play all"
							on:click|stopPropagation={() => playPlayset(playset)}
							use:tooltip={"Play all"}
							class="text-pulse-accent hover:scale-110 transition-transform leading-none" 
						>
							<i class="fa-solid fa-circle-play text-xs"></i>
						</button>
						<button 
							aria-label="Edit"
							on:click|stopPropagation={() => editPlayset(playset)}
							use:tooltip={"Edit"}
							class="text-gray-500 hover:text-orange-500 transition-colors leading-none"
						>
							<i class="fa-solid fa-pen-to-square text-[10px]"></i>
						</button>
						<button 
							aria-label="Delete"
							on:click|stopPropagation={() => deletePlayset(playset)}
							use:tooltip={"Delete"}
							class="text-gray-500 hover:text-red-500 transition-colors leading-none"
						>
							<i class="fa-solid fa-trash-can text-[10px]"></i>
						</button>
					</div>

					<!-- TRACK COUNT (Hidden on hover) -->
					<Stat item={playset}/>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- BOTTOM ROW: Metadata -->
	<div class="flex justify-between items-center text-[10px] text-gray-500 italic">
		<span class="opacity-60">{playset.genre || 'Various'}</span>
		{#if isOver}
			<span class="text-pulse-accent font-bold not-italic animate-pulse">Drop to Add</span>
		{:else}
			{#if playset.total_rating > 0}
				<Rating rating={playset.total_rating} />
			{/if}
		{/if}
	</div>
</div>

