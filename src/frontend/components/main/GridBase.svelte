<script>

import { fade } from 'svelte/transition';

import { isLoading } from '../../stores/ui';

import Item from './TrackCard.svelte';
import SkeletonItem from './SkeletonCard.svelte';

export let tracks = [];

</script>

<div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-6">
	
	{#if $isLoading}
		<!-- Show 12 skeleton cards while loading -->
		{#each Array(12) as _}
			<div out:fade={{ duration: 200 }}>
				<SkeletonItem />
			</div>
		{/each}
	{:else}
		{#each tracks as track (track.id)}
			<div in:fade={{ duration: 400 }}>
				<Item track={track} allTracks={tracks} />
			</div>
		{/each}
	{/if}
</div>
