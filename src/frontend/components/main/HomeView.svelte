<script>

import { isLoading } from '../../stores/ui';
import { isImporting } from '../../stores/import';
import { searchQuery, activeOrder } from '../../stores/selection';
import { activeTab, selectedFilter } from '../../stores/home';
import { audioCount, videoCount, trackCount } from '../../stores/library';

import Video from './Video.svelte';

import HomeViewWelcome from './HomeViewWelcome.svelte';
import Search from './Search.svelte';
import Filters from './Filters.svelte';
import Loading from './Loading.svelte';
import FileImport from '../ui/FileImport.svelte';
import ImportButtons from '../ui/ImportButtons.svelte';
import Tabs from './Tabs.svelte';

import MainView from './home/Main.svelte';

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

$: showFilters = $audioCount > 0 && $videoCount > 0;

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

<div class="relative overflow-hidden h-full w-full min-w-0 flex flex-col gap-4">

	{#if $trackCount > 0}
		<div class="flex flex-col p-4">
			<div class="flex items-center justify-between text-3xl">
				<h1 class="flex-grow font-black uppercase tracking-wider text-pulse-white/40">Your Collections</h1>
				{#if __PLATFORM__ !== 'remote'}
					{#if $isImporting}
						<FileImport />
					{:else}
						<div class="flex items-center gap-3 px-4 py-2 opacity-60 hover:opacity-100 transition-all duration-300 bg-white/10 rounded-lg">
							<ImportButtons />
						</div>
					{/if}
				{/if}
			</div>
			<p class="text-xs text-gray-500 font-medium">Welcome back to your Pulse library</p>
		</div>

		<!-- Main Layout Wrapper -->
		<div class="flex flex-col md:flex-row md:items-center w-full px-4 gap-4">
			
			<!-- Top/Left: Left Aligned Main App Collection Tabs -->
			<div class="flex-grow min-w-0">
				<Tabs activeTab={$activeTab} tabs={collectionTabs} onSelect={onCollectionChange} />
			</div>
			
			<!-- Bottom/Right Control Panel: Collapses cleanly or wraps when space is tight -->
			<div class="flex-grow md:flex-grow-0 flex items-center justify-end gap-3 min-w-0">
				{#if $activeTab == 'track' && showFilters}
					<div class="hidden md:block flex-shrink-0">
						<Tabs activeTab={$selectedFilter} tabs={filterTabs} onSelect={onFilterChange} />
					</div>
				{/if}
				
				<!-- Search input handles dynamic shrinking -->
				<div class="flex-grow md:w-64 max-w-xl min-w-[120px]">
					<Search onInput={onSearchChange}/>
				</div>
				
				<!-- Filters action -->
				<div class="flex-shrink-0">
					<Filters bind:order={$activeOrder}/>
				</div>
			</div>

		</div>

		<div class="flex-grow p-6 auto-hide-scrollbar">
			{#if $isLoading}
				<Loading />
			{:else}
				<Video />
				<MainView />
			{/if}
		</div>
	{:else}
		<HomeViewWelcome />
	{/if}
</div>
