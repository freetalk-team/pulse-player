<script>

import { onMount } from 'svelte';

import { scrollHover } from '../../../actions';
import { sleep } from '../../../utils/sleep';

import { currentRemote } from '../../../stores/remote';

import Loading from '../Loading.svelte';
import Video from '../Video.svelte';
import Tabs from '../Tabs.svelte';
import Search from '../Search.svelte';
import Filters from '../Filters.svelte';
import TrackCard from '../TrackCard.svelte';
import AlbumCard from '../AlbumCard.svelte';
import PlaylistCard from '../PlaylistCard.svelte';
import GridSentinel from '../LoadSentinel.svelte';

let remote;

const collectionTabs = [
	{ id: 'track', label: 'Tracks', icon: 'fa-music' },
	{ id: 'playset', label: 'Playsets', icon: 'fa-clock' },
	{ id: 'playlist', label: 'Playlists', icon: 'fa-list-ul' },
	{ id: 'album', label: 'Albums', icon: 'fa-record-vinyl' }
];

const filterTabs = [
	{ id: 'all', label: 'All', icon: 'fa-icons' },
	{ id: 'audio', label: 'Audio', icon: 'fa-music' },
	{ id: 'video', label: 'Video', icon: 'fa-film' }
];

let activeCollection = 'track';
let activeFilter = 'all';
let offset = 0;
let lastRequestId = 0;
let sort = 'rating';
let query = '';
let items = [];
let loading = false;
let hasMore = false;

let apiCall = api.getTracks;
let component = TrackCard;

const LIMIT = 30;
const LOADING_TIMEOUT = 800;

onMount(() => {
	
	const unsubscribe = currentRemote.subscribe(current => {
		remote = current;
		onChange();
	});
	
	return unsubscribe;
});

function selectCollection(id) {
	//activeTab.set(id);
	activeCollection = id;

	switch (id) {
		case 'track':
		apiCall = api.getTracks;
		component = TrackCard;
		break;

		default:
		apiCall = (...args) => api.getCollections(id, ...args);
		component = id == 'album' ? AlbumCard : PlaylistCard;
		break;
	}

	onChange();
}

function selectFilter(filter) {
	activeFilter = filter;
	onChange();
}

function onChange() {
	items = [];
	offset = 0;

	fetch();
}


function getQuery() {
	return {
		query,
		sort,
		filter: activeFilter,
		offset,
		limit: LIMIT
	}
}

async function fetch() {

	if (loading) return;

	loading = true;
	hasMore = true;

	// 1. Generate a unique ID for this specific fetch call
	const requestId = ++lastRequestId;
	const query = getQuery();


	// console.trace('Fetchig tracks ...');

	try {
		const [newItems] = await Promise.all([
			apiCall(query, remote.id),
			sleep(LOADING_TIMEOUT) 
		]);

		//console.debug('ITEMS:', query, newItems);

		// 2. THE FIX: If a newer request has started, discard this one!
		if (requestId !== lastRequestId) {
			// console.log('🚫 Discarding stale search result');
			return; 
		}

		if (newItems.length < LIMIT) 
			hasMore = false;
		
		// ✅ REASSIGN for reactivity
		items = [...items, ...newItems];

		offset += LIMIT;

	} finally {
		// 3. Only stop loading if this is still the active request
		if (requestId === lastRequestId) {
			loading = false;
		}

		// console.debug('Fetching done:', loading, hasMore);
	}

}

</script>


<div class="flex flex-col gap-4 mx-4 my-5">
	<div class="flex items-center justify-between">
		<Tabs activeTab={activeCollection} tabs={collectionTabs} onSelect={selectCollection} />

		{#if activeCollection == 'track'}
			<Tabs activeTab={activeFilter} tabs={filterTabs} onSelect={selectFilter} />
		{/if}
	</div>

	<div class="flex items-center justify-between">
		<div class="flex-grow max-w-md">
			<Search bind:query={query} onInput={onChange} />
		</div>
		<Filters bind:order={sort} onChange={onChange} />
	</div>
</div>


<div class="flex-1 overflow-y-auto custom-scroll min-w-0 flex flex-col"
    use:scrollHover
>
	<Video />

	<div class="min-w-0 p-8 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
		{#each items as item}
			<svelte:component
				this={component}
				{item}
				canEdit={false}
				canDnd={false}
				searchQuery={query}
			/>
		{/each}
	</div>
        
	<GridSentinel isLoading={loading} {hasMore} {fetch} />
</div>
