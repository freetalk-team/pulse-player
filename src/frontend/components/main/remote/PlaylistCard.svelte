<script>

import { fade } from "svelte/transition";

import { tooltip } from "../../../actions";
import { highlightMatch } from "../../../utils/text";
import { icon } from "../../ui/icons";

import { playPlaylist } from "../../../stores/playlist";
import { searchQuery } from "../../../stores/selection";
import { playlists } from '../../../stores/remote/downloads';

import Rating from "../Rating.svelte";
import Previews from "../Previews.svelte";
import HotNewBadge from "../HotNewBadge.svelte";
import CircleProgress from "../CircleProgress.svelte";

export let item;
export let onDownload;

$: activeDownload = $playlists[`${item.remote}_${item.id}`]; 

function formatDescription(item) {
	return `${item.genre} • ${item.track_count} tracks`;
}

function handleDownload() {
	onDownload?.('playlist', item);
}


</script>

<div 
	class="group card"
	in:fade={{ duration: 400 }}
>
	

	{#if activeDownload}
		<CircleProgress progress={activeDownload.progress} />
	{:else}
		<div class="absolute -top-1 -right-1 z-20 group-hover:hidden">
			<HotNewBadge {item} />
		</div>
		<div class="actions">
			<button class="hover:bg-purple-500/20 text-gray-200 hover:text-purple-500"
				on:click|stopPropagation={handleDownload}
				use:tooltip={"Download"}
			>
				<i class="fa-solid fa-download"></i>
			</button>
		</div>
	{/if}

	<!-- 2x2 Cover Grid -->
	<div class="preview">
		<Previews {item} />

		<!-- RATING BADGE (Top Right) -->
		{#if item.total_rating > 0}
			<Rating rating={item.total_rating} />
		{/if}

		{#if !activeDownload}
		
			<!-- Hover Controls -->
			<div class="overlay">
				<button class="button"
					on:click|stopPropagation={() => playPlaylist(item)}
					use:tooltip={"Play"}
				>
					<i class="fa-solid fa-play"></i>
				</button>
			</div>
		{/if}
	</div>

	<div class="mt-4 px-1">
		<div class="flex items-center text-sm">
			<h3 class="flex-grow font-bold text-white truncate">
				{@html highlightMatch(item.name, $searchQuery)}
			</h3>
			{@html icon(item.icon)}
		</div>
		<p class="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">
			{formatDescription(item)}
		</p>
	</div>
</div>
