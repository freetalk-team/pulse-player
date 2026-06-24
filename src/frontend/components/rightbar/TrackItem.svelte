<script>

import { fade } from 'svelte/transition';

import { formatDuration } from '../../utils/format';

export let item;
export let index;

</script>

<div
	in:fade={{ duration: 200 }}
	out:fade={{ duration: 150 }}
	class="group/track flex flex-grow w-full items-center gap-3 p-2 hover:bg-pulse-white/5 rounded cursor-pointer"
>
	<!-- {#if index}
		<span class="flex-shrink-0 text-[10px] text-gray-600 w-4">{index}</span>
	{/if} -->

	<div class="flex justify-center items-center w-8 h-8 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
		<i class="fa-solid {item.type === 'video' ? 'fa-film text-purple-500/40' : 'fa-music text-pulse-accent/40'} text-sm"></i>
	</div>
	<div class="flex-grow flex-column truncate space-y-1">
		<p class="text-xs font-medium truncate">{item.title}</p>
		<p class="text-[10px] text-gray-500 truncate">{item.artist}</p>
	</div>
	<span class="text-[10px] text-gray-600 group-hover/track:hidden">{formatDuration(item.duration)}</span>
	<div class="flex flex-shrink-0 items-center gap-2 hidden group-hover/track:block" on:click|stopPropagation>
		<slot name="actions" />
	</div>
</div>