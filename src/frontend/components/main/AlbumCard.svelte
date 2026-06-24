<script>

import { searchQuery } from "../../stores/selection";
import { playAlbum } from "../../stores/library";

import { highlightMatch } from "../../utils/text";
import { formatDescriptionHtml } from "../../utils/format";

import Rating from "./Rating.svelte";

export let item;

</script>

<div class="group relative bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 shadow-xl overflow-hidden">
	<!-- Album Cover with Glow -->
	<div class="aspect-square rounded-xl overflow-hidden bg-black/40 shadow-inner relative group">
		{#if item.cover_path}
			<img 
				src="{platform.resolve(item.cover_path)}" 
				class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
				alt={item.name} 
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
				<i class="fa-solid fa-record-vinyl text-4xl text-white/10"></i>
			</div>
		{/if}

		<!-- Hover Controls -->
		<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
			<button 
				on:click|stopPropagation={() => playAlbum(item)}
				class="w-12 h-12 bg-pulse-accent text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
			>
				<i class="fa-solid fa-play ml-1"></i>
			</button>
		</div>
	</div>

	<!-- RATING BADGE (Top Right) -->
	{#if item.total_rating > 0}
		<Rating rating={item.total_rating} />
	{/if}

	<!-- Metadata -->
	<div class="mt-4 px-1">
		<h3 class="font-bold text-white truncate text-sm">
			{@html highlightMatch(item.name, $searchQuery)}
		</h3>
		<p class="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5 truncate">
			{@html formatDescriptionHtml(item)}
		</p>
	</div>
</div>
