<script>

import { stopPropagation } from '../../actions';

import Stat from './Stat.svelte';
import Rating from './Rating.svelte';

let {
	item,
	isSelected,
	actions
} = $props();

let coverPath = $state(null);

if (__PLATFORM__ === 'web') {
	$effect(() => {
		const id = item?.cover;

		if (!id) {
			coverPath = null;
			return;
		}

		let cancelled = false;

		platform.getThumb(id).then((url) => {
			if (cancelled) {
				if (url) {
					platform.releaseThumb(id);
				}
				return;
			}

			coverPath = url;
		});

		return () => {
			cancelled = true;
			platform.releaseThumb(id);
			coverPath = null;
		};
	});
} else {
	$effect(() => {
		coverPath = item?.cover_path ?? null;
	});
}

</script>

<div 
	class="@container group/item flex flex-grow items-center gap-3 p-2 rounded-md cursor-pointer transition-all
	{isSelected ? 'bg-pulse-white/10 border-pulse-accent' : 'hover:bg-pulse-white/5'}"
	class:border-l-2={isSelected}
>
	<!-- Use the 'img://' protocol we created -->
	<div class="w-10 h-10 bg-pulse-main rounded shadow-lg overflow-hidden flex-shrink-0">
	{#if coverPath}
		<img src="{platform.resolve(coverPath)}" alt="" class="w-full h-full object-cover" />
	{:else}
		<div class="w-full h-full flex items-center justify-center text-gray-700">
			<i class="fa-solid fa-record-vinyl fa-2x"></i>
		</div>
	{/if}
	</div>

	<div class="flex-grow flex-column min-w-0">
		<div class="flex items-center justify-between @container/inline-size">
			<h4 class="flex-grow min-w-0 text-sm font-semibold truncate transition-colors 
				text-pulse-white/60 group-hover/item:text-pulse-white"
			>
				{item.name}
			</h4>
			<div
				class="hidden group-hover/item:flex items-center gap-2 pr-1 h-full transition-all"
				onclick={stopPropagation}
			>
				{@render actions?.(item)}
			</div>

			<div class="group-hover/item:hidden hidden @[200px]:block">
				<Stat duration={item.total_duration} count={item.track_count} />
			</div>
		</div>
		<div class="flex justify-between items-center mt-0.5 h-5">
			<span class="truncate pr-2 text-[10px] text-gray-500 italic">
				{item.artist}
				{#if item.year}
					<span class="ml-1 opacity-40">({item.year})</span>
				{/if}
			</span>
		</div>
		<!-- Added Genre Badge -->
		<div class="flex items-center justify-between">
			<span class="text-[9px] text-pulse-accent/70 uppercase tracking-tighter">
				{item.genre ?? 'Unknown'}
			</span>
			{#if item.total_rating > 0}
				<Rating rating={item.total_rating} />
			{/if}
		</div>
	</div>
</div>