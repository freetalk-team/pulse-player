<script>

// Svelte 5
//import { $derived } from 'svelte';

import { slide } from 'svelte/transition';

import { scrollHover, tooltip } from '../../actions';

import { isTheaterMode, clearSelection, searchQuery, activeOrder } from '../../stores/selection';
import { selectedFilter, selectedPlayset } from '../../stores/player';
import { currentTrack } from '../../stores/play';
import { createPlaylist } from '../../stores/playlist'
import { isLoading } from '../../stores/ui';

import Filters from './Filters.svelte';
import Search from './Search.svelte';
import GridTracks from './GridTracks.svelte';
import GridSets from './GridCollections.svelte';
import List from './List.svelte';
import Video from './Video.svelte';

const trackFilters = ['all', 'audio', 'video', 'playlist'];

//const showSearch = $derived($selectedFilter !== 'album');

let scrolled = false;

function handleScroll(e) {
    // scrolled = e.target.scrollTop > 0;
}

</script>

<div class="flex-grow flex flex-col min-h-0 min-w-0 overflow-hidden h-full"
	on:click={clearSelection}
>

	{#if $selectedFilter !== 'album'}
		<div class="flex-shrink-0 flex items-center my-3 px-6 py-2 gap-4">
			<!-- Search input takes the remaining space -->
			<div class="flex-grow max-w-md">
				<Search bind:query={$searchQuery} />
			</div>


			{#if $searchQuery.length > 2}
				<button 
					on:click={() => createPlaylist($searchQuery, null, true)}
					aria-label="New playlist"
					use:tooltip={"New playlist"}
					class="relative inline-flex items-center justify-center rounded-full transition-all
						bg-white/5 hover:bg-orange-500/20 text-gray-400 hover:text-orange-500"
				>
					<i class="fa-solid fa-list-ul text-2xl"></i>
					<span class="absolute -bottom-2 -right-3 flex items-center justify-center w-6 h-6 rounded-full shadow">
						<i class="fa-solid text-pulse-accent fa-circle-plus text-[14px] leading-none"></i>
					</span>
				</button>
			{/if}
			
			<!-- Filters stay at the end of the row -->
			<div class="ml-auto">
				<Filters bind:order={$activeOrder} />
			</div>
		</div>
	{/if}

	<div
		on:scroll={handleScroll}
		use:scrollHover
		class="flex-grow custom-scroll overflow-y-auto px-6 relative"
	>
		<!-- Top shadow -->
		<div
			class="sticky top-0 h-4 bg-gradient-to-b from-black/40 to-transparent pointer-events-none transition-opacity duration-200"
			class:opacity-100={scrolled}
			class:opacity-0={!scrolled}
		></div>

		{#if $isLoading}
			<Loading />
		{:else}
			<Video />
			<div class="w-full mt-4">
				{#if $selectedFilter === 'album'}
					<List />
				{:else if trackFilters.includes($selectedFilter)}
					<GridTracks />
				{:else}
					<GridSets active={selectedFilter} playset={$selectedPlayset} />
				{/if}
			</div>
		{/if}
	</div>
</div>