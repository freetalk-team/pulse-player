<script>

import { onMount } from "svelte";

import { stations, fetch, isLoading, hasMore, searchQuery, activeOrder } from '../../../stores/radio';
import { currentRadio } from "../../../stores/play";

import Grid from '../Grid.svelte';
import Card from './Card.svelte';
import Filters from '../Filters.svelte';
import Search from '../Search.svelte';

export let onDetails;

const filterOptions = [
	{ id: 'rating', icon: 'fa-star', label: 'Top Rated' },
	{ id: 'recent', icon: 'fa-clock-rotate-left', label: 'Recently Played' },
	{ id: 'favourite', icon: 'fa-heart', label: 'Favourite' }
];

const fetchStations = (reset) => fetch({}, reset);

onMount(() => {
	fetchStations(true);
});

</script>

<div class="flex h-full flex-col overflow-hidden min-w-0">
	
	<div class="flex-shrink-0 flex items-center my-3 px-6 py-2 gap-4">
		<!-- Search input takes the remaining space -->
		<div class="flex-grow max-w-md">
			<Search bind:query={$searchQuery} />
		</div>
		
		<div class="ml-auto">
			<Filters bind:order={$activeOrder} options={filterOptions} />
		</div>
	</div>

	<div class="flex-1 min-w-0 auto-hide-scrollbar">
		<div class="p-8">
			<Grid 
				component={Card}
				componentProps={{onDetails}}
				items={$stations}
				selectedItem={$currentRadio}
				fetch={fetchStations}
				isLoading={$isLoading} 
				hasMore={$hasMore} />
		</div>
	</div>
</div>

