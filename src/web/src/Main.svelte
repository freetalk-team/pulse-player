<script>

import { scrollHover } from '@frontend/actions';

import { isLoading } from '@frontend/stores/ui';
import { searchQuery, activeOrder } from '@stores/selection';
import { activeTab, selectedFilter } from '@stores/home';

import Watermark from '@components/main/Watermark.svelte';
import Video from '@components/main/Video.svelte';
import Search from '@components/main/Search.svelte';
import Filters from '@components/main/Filters.svelte';
import Loading from '@components/main/Loading.svelte';
import Tabs from '@components/main/Tabs.svelte';
import TrackView from '@components/main/track/View.svelte';
import AlbumView from '@components/main/album/View.svelte';
import PlaylistView from '@components/main/playlist/View.svelte';
import PlaysetView from '@components/main/playset/View.svelte';
import RadioView from '@components/main/radio/View.svelte';


const collectionTabs = [
	{ id: 'track', label: 'tracks', icon: 'fa-music' },
	{ id: 'playset', label: 'Playsets', icon: 'fa-clock' },
	{ id: 'playlist', label: 'Playlists', icon: 'fa-list-ul' },
	{ id: 'album', label: 'Albums', icon: 'fa-record-vinyl' },
	{ id: 'radio', label: 'Radio', icon: 'fa-radio' },
];

const filterTabs = [
	{ id: 'all', label: 'All', icon: 'fa-icons' },
	{ id: 'audio', label: 'Audio', icon: 'fa-music' },
	{ id: 'video', label: 'Video', icon: 'fa-film' }
];

//$: showFilters = $audioCount > 0 && $videoCount > 0;
const showFilters = true;

function onCollectionChange(collection) {
	activeTab.set(collection);
}

function onSearchChange(query) {
	searchQuery.set(query);
}

function onFilterChange(filter) {
	selectedFilter.set(filter);
}

</script>


<main class="relative bg-pulse-main/50 flex-shrink-1 min-w-0 w-full h-full flex flex-col gap-4">

	<Watermark />

	<div class="flex flex-col w-full px-4 gap-4 mt-6">

		<div class="flex items-center justify-between @container/inline-size">
			<Tabs bind:activeTab={$activeTab} tabs={collectionTabs} onSelect={onCollectionChange} />

			{#if $activeTab == 'track' && showFilters}
				<div class="hidden @[850px]:block">
					<Tabs activeTab={$selectedFilter} tabs={filterTabs} onSelect={onFilterChange} />
				</div>
			{/if}
		</div>

		<div class="flex items-center justify-between">
			<div class="flex-grow max-w-md">
				<Search onInput={onSearchChange} />
			</div>
			<Filters bind:order={$activeOrder}/>
		</div>
	</div>

	<div class="flex-grow p-6 auto-hide-scrollbar">
		{#if $isLoading}
			<Loading />
		{:else}
			<Video />

			{#if $activeTab == 'track'}
				<TrackView filter={selectedFilter} />
			{:else if $activeTab == 'album'}
				<AlbumView />
			{:else if $activeTab == 'playlist'}
				<PlaylistView />
			{:else if $activeTab == 'playset'}
				<PlaysetView />
			{:else if $activeTab == 'radio'}
				<RadioView />
			{/if}
		{/if}
	</div>
</main>