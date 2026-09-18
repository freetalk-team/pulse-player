<script>

import { fade } from 'svelte/transition';

import { formatStationDescriptionHtml } from '../../utils/region';

import Rating from './Rating.svelte';

export let item;
export let isSelected = false;
export let actions;

</script>

<div in:fade={{ duration: 200 }}
	class="group/item relative flex items-center overflow-hidden flex-grow gap-2 px-1 py-2 rounded-md transition-all select-none cursor-pointer
	{isSelected ? 'bg-pulse-white/10 border-pulse-accent' : 'hover:bg-pulse-white/5'}"
	class:border-l-2={isSelected}
>
	<div class="flex justify-center items-center w-10 h-10 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
		{#if item.favicon}
			<img src="{platform.resolve(item.favicon)}" alt="" class="w-8 h-8 object-cover" />
		{:else}
			<i class="fa-solid fa-radio text-[18px] text-gray-600"></i>
		{/if}
	</div>
	<div class="flex flex-col gap-1 overflow-hidden w-full">
		<div class="flex flex-1 items-center">
			<h3 class="flex-1 text-sm font-semibold truncate text-pulse-white/60 group-hover/item:text-pulse-white">
				{item.name}
			</h3>
			<div class="hidden group-hover/item:flex items-center gap-2 pr-1 h-full transition-all" on:click|stopPropagation>
				{@render actions?.(item)}
			</div>
			<div class="group-hover/item:hidden transition-all">
				{#if item.rating > 0}
					<Rating rating={item.rating} />
				{/if}
			</div>
		</div>
		<p class="text-[10px] opacity-80 truncate">
			{@html formatStationDescriptionHtml(item)}
		</p>
	</div>
</div>