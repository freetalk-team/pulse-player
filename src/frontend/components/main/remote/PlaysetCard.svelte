<script>

import { fade } from "svelte/transition";

import { tooltip } from "../../../actions";
import { highlightMatch } from "../../../utils/text";
import { icon } from "../../ui/icons";

import { playPlayset } from "../../../stores/playsets";
import { searchQuery } from "../../../stores/selection";

import Rating from "../Rating.svelte";
import Previews from "../Previews.svelte";
import HotNewBadge from "../HotNewBadge.svelte";

export let item;

function formatDescription(item) {
	return `${item.genre} • ${item.member_count} sets`;
}

</script>

<div 
	class="group card"
	in:fade={{ duration: 400 }}
>
	<div class="absolute -top-1 -right-1 z-20 group-hover:hidden">
		<HotNewBadge {item} />
	</div>

	<!-- <div class="absolute top-1 right-1 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded">
		<button class="h-6 w-6 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-500/20 text-gray-400 hover:text-purple-500"
			on:click|stopPropagation={handleDownload}
			use:tooltip={"Download"}
		>
			<i class="fa-solid fa-download text-xs"></i>
		</button>
	</div> -->

	<!-- 2x2 Cover Grid -->
	<div class="preview">
		<Previews {item} />

		<!-- RATING BADGE (Top Right) -->
		{#if item.total_rating > 0}
			<Rating rating={item.total_rating} />
		{/if}
		
		<!-- Hover Controls -->
		<div class="overlay">
			<button class="button"
				on:click|stopPropagation={() => playPlayset(item)}
				use:tooltip={"Play"}
			>
				<i class="fa-solid fa-play"></i>
			</button>
		</div>
	</div>

	<div class="mt-4 px-1">
		<div class="flex items-center text-sm">
			<h3 class="flex-grow font-bold text-white truncate text-sm">
				{@html highlightMatch(item.name, $searchQuery)}
			</h3>
			{@html icon(item.icon)}
		</div>
		<p class="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">
			{formatDescription(item)}
		</p>
	</div>
</div>
