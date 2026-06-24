<script>

import { fade } from "svelte/transition";

import { editPlaylist, playPlaylist } from "../../stores/playlist";
import { editPlayset, playPlayset } from "../../stores/playsets";
import { searchQuery } from "../../stores/selection";
import { highlightMatch } from "../../utils/text";
import { startDragging, stopDragging } from "../../actions";

import Rating from "./Rating.svelte";

export let item;
export let canEdit = true;
export let type = 'playlist';

const previews = item.cover_path ? item.cover_path.split(',') : [];
const itemType = item.type || type;

const edit = itemType === 'playlist' ? editPlaylist : editPlayset;
const play = itemType === 'playlist' ? playPlaylist : playPlayset;
const isNew = !item.played_at;

// const icon = itemType === 'playlist' ? 'fa-list-ul text-orange-400' : 'fa-clock text-blue-400';
const icon = `${item.icon} ${item.icon_color}`;

function formatDescription() {
	return `${item.genre} • ${item.track_count} Tracks`;
}

function handleDragStart(e) {
	startDragging(e, [item], 'sets');
}

</script>

<div 
	class="group relative bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 shadow-xl"
	in:fade={{ duration: 400 }}
	draggable="true"
	on:dragstart={handleDragStart}
	on:dragend={stopDragging}
>

	{#if isNew}
		<div class="absolute -top-1 -right-1 z-20 bg-pulse-accent/40 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
			NEW
		</div>
	{:else if item.total_rating > 100}
		<div class="absolute -top-1 -right-1 bg-orange-500/50 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
			HOT
		</div>
	{/if}

	<!-- 2x2 Cover Grid -->
	<div class="aspect-square grid grid-cols-2 grid-rows-2 gap-1 rounded-xl overflow-hidden bg-black/40 shadow-inner">
		{#each Array(4) as _, i}
			<div class="bg-white/5 flex items-center justify-center">
				{#if previews[i]}
					<img src="{platform.resolve(previews[i])}" class="w-full h-full object-cover" alt="" />
				{:else}
					<i class="fa-solid {item.icon || 'fa-music'} opacity-10 text-xl"></i>
				{/if}
			</div>
		{/each}

		<!-- RATING BADGE (Top Right) -->
		{#if item.total_rating > 0}
			<Rating rating={item.total_rating} />
		{/if}
		
		<!-- Hover Controls -->
		<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
			<button
				on:click|stopPropagation={() => play(item)}
				class="w-12 h-12 bg-pulse-accent text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
			>
				<i class="fa-solid fa-play ml-1"></i>
			</button>

			{#if canEdit}
				<button 
					on:click|stopPropagation={() => edit(item)} 
					class="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
				>
					<i class="fa-solid fa-pen-to-square text-xs"></i>
				</button>
			{/if}
		</div>
	</div>

	<div class="mt-4 px-1">
		<div class="flex items-center">
			<h3 class="flex-grow font-bold text-white truncate text-sm">
				{@html highlightMatch(item.name, $searchQuery)}
			</h3>
			<i class="fa-solid text-sm {icon}"></i>
		</div>
		<p class="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">
			{formatDescription()}
		</p>
	</div>
</div>
