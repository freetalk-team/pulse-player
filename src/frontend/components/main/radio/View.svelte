<script>

import { onMount } from "svelte";
import { get } from "svelte/store";

import { stations, fetch, isLoading, hasMore } from '../../../stores/radio';
import { searchQuery, activeOrder } from '../../../stores/selection';
import { currentRadio } from "../../../stores/play";

import Grid from '../Grid.svelte';
import Card from './Card.svelte';

const fetchStations = (reset) => fetch({
	query: get(searchQuery),
	sort: get(activeOrder),
	favourite: true
}, reset);

onMount(() => {

    let initialized = false;

    const unsubscribeSearch = searchQuery.subscribe(v => {
        if (!initialized) return;
        fetchStations(true);
    });

    const unsubscribeOrder = activeOrder.subscribe(v => {
        if (!initialized) return;
        fetchStations(true);
    });

    initialized = true;

	fetchStations(true);

    return () => {
        unsubscribeSearch();
        unsubscribeOrder();
    }
});

</script>

<Grid 
    component={Card}
    items={$stations}
    fetch={fetchStations}
    selectedItem={$currentRadio}
    isLoading={$isLoading} 
    hasMore={$hasMore} />