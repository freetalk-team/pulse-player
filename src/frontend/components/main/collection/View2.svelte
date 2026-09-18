<script>

import { onMount } from "svelte";
import { get } from 'svelte/store';

import { startDragging, stopDragging as onDragEnd, clickOutside } from '../../../actions';

import { collections, fetch, isLoading, hasMore } from '../../../stores/collections';
import { searchQuery, activeOrder, editMode } from '../../../stores/selection';

import Grid from '../Grid.svelte';
import Card from './Card.svelte';

export let filter;

const fetchCollection = (reload) => fetch($filter, reload);

onMount(() => {

	fetchCollection(true);

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

    const unsubscribeFilter = filter.subscribe(v => fetchCollection(true));

    return () => {
        unsubscribeSearch();
        unsubscribeOrder();
        unsubscribeFilter();
    }
});

const selected = new Map;

let lastSelected;
let selectedItem;

const _id = (item) => `${item.type}_${item.id}`;

function onSelect(item, e) {

    const id = _id(item);

	if (e.shiftKey) {
		if (lastSelected) {

            const items = get(collections);

			const lastIdx = items.findIndex(t => _id(t) === lastSelected);
			const currentIdx = items.findIndex(t => _id(t) === id);
			
			const start = Math.min(lastIdx, currentIdx);
			const end = Math.max(lastIdx, currentIdx);
			
			// Select everything in the range
			items.slice(start, end + 1).forEach(t => selected.set(_id(t), t));
		}
		else {
			lastSelected = id;
			selected.set(id, item);
		}
	}
	else if (e.ctrlKey || e.metaKey) {
		if (selected.has(id)) {
			selected.delete(id);
			if (id == lastSelected)
				lastSelected = null;

		} else {
			selected.set(id, item);
			lastSelected = id;
		} 

	}
	else {

		lastSelected = id;
		selected.set(id, item);
	}

	selectedItem = new Set(selected.keys());
}

function onDragStart(item, e) {

	let itemsToDrag = [];

	// 1. Determine what we are dragging
	if (selected.has(_id(item))) {
		// Drag all selected items from the store
		itemsToDrag = [...selected.values()];
	} else {
		// Drag only this one
		itemsToDrag = [item];
	}

	//console.debug('Start dragging:', itemsToDrag, dndType);

	startDragging(e, itemsToDrag, 'set');
}

function clearSelection() {
	//console.debug('Grid view clear selection');

	lastSelected = null;
	selectedItem = null;
	selected.clear();
}

</script>

<div on:click={clearSelection} use:clickOutside={clearSelection}>

<Grid 
    items={$collections}
    {selectedItem}
    component={Card} 
    componentProps={{ onSelect, onDragStart, onDragEnd, isEditing: $editMode == 'playset'}}
    searchQuery={$searchQuery}
    fetch={fetchCollection}
    isLoading={$isLoading}
    hasMore={$hasMore} />

</div>
