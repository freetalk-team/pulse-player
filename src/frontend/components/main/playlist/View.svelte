<script>

import { onMount } from "svelte";

import { playlists, fetch, isLoading, hasMore } from '../../../stores/playlist';
import { searchQuery, activeOrder, editMode } from '../../../stores/selection';

import Grid from '../GridSelect.svelte';
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
    componentProps={{isEditing: $editMode == 'playset'}}
    items={$playlists}
    {fetch} 
    isLoading={$isLoading} 
    hasMore={$hasMore}
    dndType={'playlist'}
/>