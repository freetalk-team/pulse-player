<script>

import { onMount } from 'svelte';
import { get } from 'svelte/store';

import { startDragging, stopDragging as onDragEnd, clickOutside } from '../../../actions';

import { tracks, isLoading, loadTracks } from '../../../stores/albums';
import { selectedAlbum } from '../../../stores/player';

import Loading from '../Loading.svelte';
import Item from './Item.svelte';

onMount(() => selectedAlbum.subscribe(v => {
	if (v)
		loadTracks(v.id);
}));

const selected = new Map;
const lastSelected = [];

let selectedItems = new Set;

function onSelect(item, index, e) {

	if (selected.has(item.id)) {
		selected.delete(item.id);

		const index = lastSelected.findIndex(i => i == item.id);
		if (index != -1)
			lastSelected.splice(index, 1);
	}
	else {
		if (e.shiftKey && lastSelected.length > 0) {
			const last = lastSelected[lastSelected.length - 1];

			const min = Math.min(index, last);
			const max = Math.max(index, last);
			const items = get(tracks);

			for (let i = min; i <= max; ++i)
				selected.set(items[i].id, items[i]);
		}
		else {
			selected.set(item.id, item);
		}

		lastSelected.push(index);
	}

	selectedItems = new Set(selected.keys());
}

function clearSelection() {
	selected.clear();
	selectedItems = new Set;
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

	startDragging(e, itemsToDrag, 'tracks');
}

</script>

{#if $isLoading}
	<div class="mt-10">
		<Loading />
	</div>
{:else}

<div class="mx-auto max-w-4xl" 
	on:click={clearSelection} 
	use:clickOutside={clearSelection}
>

	<div class="flex items-center p-2 gap-4 text-gray-500 text-[10px] uppercase tracking-widest">
		<span>#</span>
		<span class="flex-grow">Title</span>
		<i class="fa-regular fa-clock"></i>
	</div>

	{#each $tracks as item, index (item.id)}
		<Item {item} {index} {onSelect} {onDragStart} {onDragEnd} isSelected={selectedItems.has(item.id)} />
	{/each}

</div>

{/if}