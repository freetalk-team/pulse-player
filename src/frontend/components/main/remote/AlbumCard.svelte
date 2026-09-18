<script>

import { tooltip } from "../../../actions";
import { highlightMatch } from "../../../utils/text";
import { formatDescriptionHtml } from "../../../utils/format";

import { searchQuery } from "../../../stores/selection";
import { playAlbum } from "../../../stores/albums";
import { albums } from '../../../stores/remote/downloads';

import Rating from "../Rating.svelte";
import HotNewBadge from "../HotNewBadge.svelte";
import CircleProgress from "../CircleProgress.svelte";

export let item;
export let onDownload;

$: activeDownload = $albums[`${item.remote}_${item.id}`]; 

function handleDownload() {
	// downloadAlbum(item);
	onDownload?.('album', item);
}


</script>

<div class="group card">

	<div class="absolute -top-1 -right-1 z-20 group-hover:hidden">
		<HotNewBadge {item} />
	</div>

	<!-- Album Cover with Glow -->
	<div class="thumb">
		{#if item.cover_path}
			<img 
				src="{platform.resolve(item.cover_path)}" 
				alt={item.name} 
			/>
		{:else}
			<div class="icon">
				<i class="fa-solid fa-record-vinyl text-pulse-white/20"></i>
			</div>
		{/if}

		{#if activeDownload}
			<CircleProgress progress={activeDownload.progress} />
		{:else}

			<!-- Hover Controls -->
			<div class="overlay">
				<button 
					on:click|stopPropagation={() => playAlbum(item)}
					use:tooltip={"Play"}
					class="button"
				>
					<i class="fa-solid fa-play"></i>
				</button>
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
		</div>

	<!-- RATING BADGE (Top Right) -->
	{#if item.total_rating > 0}
		<Rating rating={item.total_rating} />
	{/if}

	<!-- Metadata -->
	<div class="mt-4 px-1">
		<h3 class="font-bold text-pulse-white truncate text-sm">
			{@html highlightMatch(item.name, $searchQuery)}
		</h3>
		<p class="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5 truncate">
			{@html formatDescriptionHtml(item)}
		</p>
	</div>
</div>
