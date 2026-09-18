<script>

import { formatDuration } from '../../../utils/format';
import { playTrack } from '../../../stores/play';

import RatingStars from '../RatingStars.svelte';

export let item;
export let index;
export let onSelect;
export let isSelected;
export let onDragStart;
export let onDragEnd;

function handleClick(e) {
	if (e.ctrlKey || e.metaKey || e.shiftKey)
		onSelect?.(item, index, e);
	else
		playTrack(item);
}

function handleDragStart(e) {
	onDragStart?.(item, e);
}

</script>

<div draggable="true"
	class="group w-full flex items-center px-2 py-3 my-2 gap-4 rounded-md  transition-colors cursor-pointer text-sm
	{isSelected ? 'bg-pulse-accent/5' : 'hover:bg-pulse-white/5'}"
	on:click|stopPropagation={handleClick}
	on:dragstart={handleDragStart}
	on:dragend={onDragEnd}
>
	<span class="text-gray-500 group-hover:text-pulse-accent">{index + 1}</span>
	<div class="flex flex-col w-full gap-2">
		<h2 class="flex-1 truncate font-medium text-gray-200">{item.title}</h2>
		<RatingStars rating={item.rating} />
	</div>
	<span class="text-right text-gray-500 font-mono text-xs">{formatDuration(item.duration)}</span>
</div>