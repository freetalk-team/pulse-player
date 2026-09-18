<script>

import { fade } from 'svelte/transition';

import DurationBadge from '../ui/DurationBadge.svelte';

export let item;
export let ctx;
export let actions;

</script>

<div
	in:fade={{ duration: 200 }}
	out:fade={{ duration: 150 }}
	class="group/track flex flex-grow w-full items-center gap-3 p-2 hover:bg-pulse-white/5 rounded cursor-pointer"
>

    <div class="flex justify-center items-center w-8 h-8 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
		{#if item.cover_path}
			<img src="{platform.resolve(item.cover_path)}" alt="" class="w-full h-full object-cover" />
		{:else}
			<i class="fa-solid fa-record-vinyl text-gray-700 text-[16px]"></i>
		{/if}
    </div>
	<div class="flex-grow flex-column truncate space-y-1">
		<p class="text-xs font-medium truncate">{item.name}</p>
		<p class="text-[10px] text-gray-500 truncate">
			<span class="font-semibold text-pulse-accent/50 mr-2">{item.genre}</span>
			<i>{item.track_count} tracks</i>
		</p>
	</div>
	<span class="text-[10px] text-gray-600 group-hover/track:hidden">
		<DurationBadge duration={item.total_duration} />
	</span>
	<div class="flex flex-shrink-0 items-center gap-2 hidden group-hover/track:flex" on:click|stopPropagation>
		{@render actions?.(item, ctx)}
	</div>
</div>