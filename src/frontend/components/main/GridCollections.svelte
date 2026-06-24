<script>

import { onMount } from 'svelte';

import { sleep } from '../../utils/sleep';

import { getSetsQuery as getQuery, searchQuery, activeOrder } from '../../stores/selection';

import GridSentinel from './LoadSentinel.svelte';
import PlaylistCard from './PlaylistCard.svelte';
import AlbumCard from './AlbumCard.svelte';

export let active;
export let playset;

const LIMIT = 30;
const LOADING_TIMEOUT = 600;

let offset = 0;
let isLoading = false;
let hasMore = false;
let lastRequestId = 0; // 👈 Track the latest request
let items = [];
let collection;
let searchTimeout;

$: {
	$active;
	$activeOrder;
	$searchQuery;
	playset;

	clearTimeout(searchTimeout);

	searchTimeout = setTimeout(() => {
		resetState();
		fetch();
	}, 300);
}

function resetState() {
	offset = 0;
	hasMore = true;
	isLoading = false;
	items = [];

	collection = resolveCollection($active);
}

function resolveCollection(id) {
	switch (id) {
		case 'sets':
		return ['album', 'playlist'];

		case 'all':
		case null:
		return null;

		default:
		return singular(id);
	}

	function singular(s) {
		return s.endsWith('s')
			? s.substr(0, s.length - 1)
			: s;
	}
}

async function fetch() {

	if (isLoading) return;

	// 1. Generate a unique ID for this specific fetch call
	const requestId = ++lastRequestId;
	const query = getQuery();

	query.offset = offset;
	query.limit = LIMIT;
	query.id = playset?.id;

	isLoading = true;

	try {
		const [newItems] = await Promise.all([
			api.getCollections(collection, query),
			sleep(LOADING_TIMEOUT) 
		]);

		// console.log('###', newItems);

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
			isLoading = false;
		}
	}
}

</script>

<div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
	{#each items as item}
		{#if collection === 'album' || item.type === 'album'}
			<AlbumCard {item} />
		{:else}
			<PlaylistCard 
				{item} 
				canEdit={true}
			/>
		{/if}
	{/each}
</div>

<GridSentinel {items} {isLoading} {hasMore} {fetch} />