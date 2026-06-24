<script>

import { onMount } from 'svelte';
import { fade } from 'svelte/transition';

import { sets, isLoading, hasMore } from '../../stores/tracks';
import { fetchSets } from '../../stores/library';
import { playlistPreviews } from '../../stores/playlist';

import PlaylistCard from './PlaylistCard.svelte';
import AlbumCard from './AlbumCard.svelte';

let sentinel;

onMount(async () => {
	// Ensure we have data on mount if the store hasn't finished its first fetch
	if ($sets.length === 0) {
		await fetchSets(true);
	}

	const observer = new IntersectionObserver((entries) => {
		// Only trigger "More" if we aren't already loading and we have some tracks
		if (entries[0].isIntersecting && !$isLoading && $sets.length > 0) {
			fetchSets();
		}
	}, { rootMargin: '300px' });

	if (sentinel) observer.observe(sentinel);
	return () => observer.disconnect();
});

</script>

<div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
	{#each $sets as item (item.type + item.id)}
		{#if item.type === 'playlist'}
			<PlaylistCard 
				playlist={item} 
				canEdit={false}
			/>
		{:else}
			<AlbumCard album={item} />
		{/if}
	{/each}
</div>

<!-- LOADING ANIMATION / SENTINEL -->
<div bind:this={sentinel} class="w-full py-10 flex flex-col items-center justify-center">
	{#if $isLoading && $hasMore}
		<div class="flex flex-col items-center gap-3">
			<!-- Pulse Lightning Spinner -->
			<div class="w-8 h-8 border-2 border-pulse-accent border-t-transparent rounded-full animate-spin"></div>
			<span class="text-[10px] text-gray-500 uppercase tracking-widest font-bold animate-pulse">
				Syncing Pulse...
			</span>
		</div>
	{:else if !$hasMore && $sets.length > 0}
		<div class="text-gray-700 text-xs italic">End of Library</div>
	{/if}
</div>