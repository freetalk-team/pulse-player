<script>

import { onMount } from 'svelte';

import { scrollHover } from '../../../actions';

import { isLoading, hasMore, fetch, items } from '../../../stores/remote/library';
import { currentRemote } from '../../../stores/remote';

import Video from '../Video.svelte';
import Tabs from '../Tabs.svelte';
import Search from '../Search.svelte';
import Filters from '../Filters.svelte';
import Grid from '../Grid.svelte';

import TrackCard from './TrackCard.svelte';
import AlbumCard from './AlbumCard.svelte';
import PlaylistCard from './PlaylistCard.svelte';
import PlaysetCard from './PlaysetCard.svelte';

export let onDownload;

const collectionTabs = [
	{ id: 'track', label: 'Tracks', icon: 'fa-music' },
	{ id: 'playsets', label: 'Playsets', icon: 'fa-clock' },
	{ id: 'playlists', label: 'Playlists', icon: 'fa-list-ul' },
	{ id: 'albums', label: 'Albums', icon: 'fa-record-vinyl' }
];

const filterTabs = [
	{ id: 'all', label: 'All', icon: 'fa-icons' },
	{ id: 'audio', label: 'Audio', icon: 'fa-music' },
	{ id: 'video', label: 'Video', icon: 'fa-film' }
];

const params = {
	filter: 'all',
	sort: 'recent',
	query: ''
};

let collection = 'track';
let component = TrackCard;

const fetchItems = (reset) => fetch(collection, params, reset);

onMount(() => currentRemote.subscribe(remote => {
	console.debug('Remote library fetch:', remote);

	if (remote)
		fetchItems(true);
}));

function onCollectionChange() {

	console.debug('Remote collection change:', collection);

	switch (collection) {
		case 'track':
		component = TrackCard;
		break;

		case 'albums':
		component = AlbumCard;
		break;

		case 'playlists':
		component = PlaylistCard;
		break;

		case 'playsets':
		component = PlaysetCard;
		break;
	}

	fetchItems(true);
}

function onFilterChange(filter) {
	params.filter = filter;
	fetchItems(true);
}

function onSortChange(order) {
	params.sort = order;
	fetchItems(true);
}

function onSearchChange(query) {
	params.query = query;
	fetchItems(true);
}



</script>


<div class="flex flex-col gap-4 mx-4 my-5">
	<div class="flex items-center justify-between @container/inline-size">
		<Tabs bind:activeTab={collection} tabs={collectionTabs} onSelect={onCollectionChange} />

		{#if collection == 'track'}
			<div class="hidden @[850px]:block">
				<Tabs activeTab={params.filter} tabs={filterTabs} onSelect={onFilterChange} />
			</div>
		{/if}
	</div>

	<div class="flex items-center justify-between">
		<div class="flex-grow max-w-md">
			<Search query={params.query} onInput={onSearchChange} />
		</div>
		<Filters order={params.sort} onChange={onSortChange} />
	</div>
</div>


<div class="flex-1 overflow-y-auto custom-scroll min-w-0 flex flex-col px-6"
    use:scrollHover
>
	<Video />

	<div class="py-4">
		<Grid 
			{component}
			items={$items}
			searchQuery={params.query}
			fetch={fetchItems}
			isLoading={$isLoading} 
			hasMore={$hasMore}
			componentProps={{onDownload}}
		/>
	</div>

</div>
