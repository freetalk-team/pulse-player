<script>

import { onMount } from "svelte";

import { collections, fetch, isLoading, hasMore } from '../../../stores/collections';
import { searchQuery, activeOrder, editMode } from '../../../stores/selection';

import Grid from '../GridSelect.svelte';
import Card from './Card.svelte';

export let filter;
export let playset;

let collection;

const fetchCollection = (reload) => fetch(collection, reload);

onMount(() => {

    let initialized = false;

    const unsubscribeSearch = searchQuery.subscribe(v => {
        if (!initialized) return;
        fetchCollection(true);
    });

    const unsubscribeOrder = activeOrder.subscribe(v => {
        if (!initialized) return;
        fetchCollection(true);
    });

    initialized = true;

    const unsubscribePlayset = playset
		? playset.subscribe(v => {
			if (v) {
                collection = v.id;
				fetchCollection(true);
            }
		})
		: () => {};

    const unsubscribeFilter = filter.subscribe(v => {
        if (['collections'].includes(v)) {
            collection = v;
            fetchCollection(true);
        }
    });

    return () => {
        unsubscribeSearch();
        unsubscribeOrder();
        unsubscribePlayset();
        unsubscribeFilter();
    }
});


</script>

<Grid 
    items={$collections}
    component={Card} 
    componentProps={{ isEditing: $editMode == 'playset'}}
    searchQuery={$searchQuery}
    fetch={fetchCollection}
    isLoading={$isLoading}
    hasMore={$hasMore}
    dndType={'set'}
/>

