<script>

// Svelte 5
//import { $derived } from 'svelte';

import { scrollHover, tooltip } from '../../actions';

import { clearSelection, searchQuery, activeOrder } from '../../stores/selection';
import { selectedFilter, selectedPlaylist, selectedPlayset } from '../../stores/player';
import { createPlaylist } from '../../stores/playlist';
import { createPlayset } from '../../stores/playsets';
import { tracks } from '../../stores/tracks';
import { collections } from '../../stores/collections';

import { isLoading } from '../../stores/ui';

import Filters from './Filters.svelte';
import Search from './Search.svelte';
import Video from './Video.svelte';

import TrackView from './track/View.svelte';
import AlbumView from './album/View.svelte';
import TrackList from './album/List.svelte';
import PlaylistView from './playlist/View.svelte';
import PlaysetView from './playset/View.svelte';
import CollectionView from './collection/View.svelte';

const trackFilters = ['all', 'audio', 'video', 'playlist'];

//const showSearch = $derived($selectedFilter !== 'album');

let scrolled = false;

function handleScroll(e) {
    // scrolled = e.target.scrollTop > 0;
}

function handleSearchChange(query) {
	searchQuery.set(query);
}

function handleCreatePlaylist() {
	createPlaylist($searchQuery, $tracks, true);
}

function handleCreatePlayset() {
	createPlayset($searchQuery, $collections, true);
}

</script>

<div class="flex-grow flex flex-col min-h-0 min-w-0 overflow-hidden h-full"
	on:click={clearSelection}
>

	{#if $selectedFilter !== 'album'}
		<div class="flex-shrink-0 flex items-center my-3 px-6 py-2 gap-4">
			<!-- Search input takes the remaining space -->
			<div class="flex-grow max-w-md">
				<Search onInput={handleSearchChange} />
			</div>

			{#if $searchQuery.length > 2}
				{#if ['collections', 'albums', 'playlists', 'playset'].includes($selectedFilter)}
					<button 
						on:click={handleCreatePlayset}
						use:tooltip={"New playset"}
						class="relative inline-flex items-center justify-center rounded-full transition-all
							bg-white/5 hover:bg-orange-500/20 text-gray-400 hover:text-blue-500"
					>
						<i class="fa-solid fa-sliders text-2xl"></i>
						<span class="absolute -bottom-2 -right-3 flex items-center justify-center w-6 h-6 rounded-full shadow">
							<i class="fa-solid text-pulse-accent fa-circle-plus text-[14px] leading-none"></i>
						</span>
					</button>

				{:else if ['audio', 'video', 'playlist'].includes($selectedFilter)}
					<button 
						on:click={handleCreatePlaylist}
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
			{/if}
			
			<!-- Filters stay at the end of the row -->
			<div class="ml-auto">
				<Filters bind:order={$activeOrder} />
			</div>
		</div>
	{/if}

	<div class="flex-grow px-6 relative auto-hide-scrollbar">
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
					<TrackList />
				{:else if trackFilters.includes($selectedFilter)}
					<TrackView filter={selectedFilter} playlist={selectedPlaylist} />
				{:else if $selectedFilter == 'albums'}
					<AlbumView />
				{:else if $selectedFilter == 'playlists'}
					<PlaylistView />
				{:else if $selectedFilter == 'playsets'}
					<PlaysetView />
				{:else}
					<CollectionView filter={selectedFilter} playset={selectedPlayset} />
				{/if}
			</div>
		{/if}
	</div>
</div>