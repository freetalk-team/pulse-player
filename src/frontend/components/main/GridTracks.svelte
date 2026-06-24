<script>

import { onMount } from 'svelte';
import { fade } from 'svelte/transition';


import { tracks, isLoading, hasMore, fetch } from '../../stores/tracks';
import { searchQuery } from '../../stores/selection';

// import Item from './GridItemBasic.svelte';
import Item from './TrackCard.svelte';
import GridSentinel from './LoadSentinel.svelte';


</script>

<div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
	{#each $tracks as item}
		<div in:fade={{ duration: 400 }}>
			<Item {item} allTracks={$tracks} searchQuery={$searchQuery} />
		</div>
	{/each}
	
</div>

<GridSentinel isLoading={$isLoading} hasMore={$hasMore} {fetch} />

