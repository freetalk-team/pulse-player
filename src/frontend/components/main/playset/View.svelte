<script>

import { onMount } from "svelte";

import { playsets, fetch, isLoading, hasMore } from '../../../stores/playsets';
import { searchQuery, activeOrder } from '../../../stores/selection';

import Grid from '../Grid.svelte';
import Card from './Card.svelte';

onMount(() => {

	fetch(true);

    let initialized = false;

    const unsubscribeSearch = searchQuery.subscribe(v => {
        if (!initialized) return;
        fetch(true);
    });

    const unsubscribeOrder = activeOrder.subscribe(v => {
        if (!initialized) return;
        fetch(true);
    });

    initialized = true;

    return () => {
        unsubscribeSearch();
        unsubscribeOrder();
    }
});

</script>

<Grid 
    component={Card} 
    items={$playsets}
    {fetch} 
    isLoading={$isLoading} 
    hasMore={$hasMore} />