<script>

import { startDragging, stopDragging as onDragEnd, clickOutside } from '../../actions';

import Grid from './Grid.svelte';

export let component;
export let items;
export let isLoading = false;
export let hasMore = false;
export let fetch;
export let searchQuery = '';
export let componentProps = {};
export let dndType;

const selected = new Map;

let lastSelected;
let selectedItem;

function onSelect(item, e) {


	if (e.shiftKey) {
		if (lastSelected) {

			const lastIdx = items.findIndex(t => t.id === lastSelected);
			const currentIdx = items.findIndex(t => t.id === item.id);
			
			const start = Math.min(lastIdx, currentIdx);
			const end = Math.max(lastIdx, currentIdx);
			
			// Select everything in the range
			items.slice(start, end + 1).forEach(t => selected.set(t.id, t));
		}
		else {
			lastSelected = item.id;
			selected.set(item.id, item);
		}
	}
	else if (e.ctrlKey || e.metaKey) {
		if (selected.has(item.id)) {
			selected.delete(item.id);
			if (item.id == lastSelected)
				lastSelected = null;

		} else {
			selected.set(item.id, item);
			lastSelected = item.id;
		} 

	}
	else {
		
		lastSelected = item.id;
		selected.clear();
		selected.set(item.id, item);
	}

	selectedItem = new Set(selected.keys());
}

function onDragStart(item, e) {

	let itemsToDrag = [];

	// 1. Determine what we are dragging
	if (selected.has(item.id)) {
		// Drag all selected items from the store
		itemsToDrag = [...selected.values()];
	} else {
		// Drag only this one
		itemsToDrag = [item];
	}

	//console.debug('Start dragging:', itemsToDrag, dndType);

	startDragging(e, itemsToDrag, dndType);
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
    {items}
    {selectedItem}
    {component} 
    componentProps={{ onSelect, onDragStart, onDragEnd, ...componentProps }}
    {searchQuery}
    {fetch}
    {isLoading}
    {hasMore} />

</div>
