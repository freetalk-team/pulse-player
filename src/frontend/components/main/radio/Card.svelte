<script>

import { tooltip, stopPropagation } from '../../../actions';
import { formatLocationHtml } from '../../../utils/region';
import { formatTags } from '../../../utils/format';
import { highlightMatch } from '../../../utils/text';

import { toggleFavourite, play, searchQuery } from '../../../stores/radio';
import { share } from '../../../stores/share';

import RadioIcon from '@resources/radio.svg?asset';
import Rating from '../RatingStars.svelte';

export let item;
export let isSelected = false;
export let onDetails;

let isNew = !item.played_at;

function handleOpen() {
	onDetails?.(item);
}

function handleShare() {
	share.set({ type: 'radio', item });
}

</script>

<div 
	role="button" tabindex="0"
	onclick={() => play(item)}
	class="group card"
	class:selected={isSelected}
>
	
	{#if isNew}
		<div class="absolute -top-1 -left-1 z-20 bg-pulse-accent/40 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
			NEW
		</div>
	{/if}

	{#if __PLATFORM__ === 'desktop'}
		<div class="actions">
			<button class="text-gray-200 hover:bg-purple-500/20 hover:text-purple-500"
				onclick={stopPropagation(handleShare)}
				use:tooltip={"Share"}
			>
				<i class="fa-solid fa-share-nodes"></i>
			</button>
			{#if !!onDetails}
				<button class="text-gray-200 hover:bg-pulse-accent/20 hover:text-pulse-accent"
					onclick={stopPropagation(handleOpen)}
					use:tooltip={"Details"}
				>
					<i class="fa-solid fa-circle-info"></i>
				</button>
			{/if}
		</div>
	{/if}

	<!-- IMAGE AREA -->
	<div class="thumb">
		{#if item.favicon}
			<img
				draggable="false"
				src={platform.resolve(item.favicon)}
				alt="" 
				onerror={(event) => {
					const img = event.currentTarget;
					img.onerror = null;
					img.src = RadioIcon;
				}}
			/>
		{:else}
			<div class="icon">
				<i class="fa-solid fa-radio"></i>
			</div>
		{/if}

		<div class="overlay">
			<div class="button">
				<i class="fa-solid fa-play"></i>
			</div>
			<!-- <div class="w-12 h-12 bg-pulse-accent rounded-full flex items-center justify-center text-black shadow-2xl scale-75 group-hover:scale-100 transition-transform">
				<i class="fa-solid fa-play text-xl ml-1"></i>
			</div> -->
		</div>
	</div>

	<!-- TEXT INFO -->
	<div class="px-1">
		<h4 class="text-sm font-bold truncate mb-0.5" use:tooltip={item.name}>
			{@html highlightMatch(item.name, $searchQuery)}
		</h4>

		<p class="text-[10px] text-gray-400 truncate mb-1">
			{@html formatLocationHtml(item)}
		</p>

		<p class="text-[10px] truncate mb-1 uppercase text-pulse-accent tracking-wider">
			{formatTags(item.tags || 'various')}
		</p>

		<!-- RATING & TYPE -->
		<div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
			<Rating rating={item.rating} />
			<button
				onclick={stopPropagation(() => toggleFavourite(item))}
				class="hover:scale-110 transition-transform"
			>
				<i class="text-xs {item.favourite ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart"></i>
			</button>
		</div>
	</div>
</div>
