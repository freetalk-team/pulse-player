<script>

import { flip } from 'svelte/animate';

import { dndzone } from 'svelte-dnd-action';

import { isOverlapping } from '../../utils/time';
import { activeEditPlayset } from '../../stores/selection';

import PlaysetMemberItem from './PlaysetMemberItem.svelte';

let items = $activeEditPlayset?.members || [];

// 1. Reactive Collision Detection
// This finds every item ID that overlaps with at least one other item
$: collidedIds = (() => {
	const items = $activeEditPlayset?.members || [];
	const collisions = new Set();

	for (let i = 0; i < items.length; i++) {
		for (let j = i + 1; j < items.length; j++) {
			if (isOverlapping(items[i], items[j])) {
				collisions.add(items[i].id);
				collisions.add(items[j].id);
			}
		}
	}
	return collisions;
})();

function handleDndConsider(e) {
	items = e.detail.items;
}

function handleDndFinalize(e) {
	items = e.detail.items;
	activeEditPlayset.update(playset => {
		playset.items = items;
		return playset;
	});
}


</script>

<div class="flex flex-col h-full bg-black/20 p-4">
	<header class="mb-4">
		<h2 class="text-xs font-black uppercase tracking-widest text-orange-500">Playset Scheduler</h2>
		<p class="text-[10px] text-gray-500">Drag Albums/Playlists here to schedule</p>
	</header>

	<div 
		use:dndzone={{items, flipDurationMs: 300}}
		on:consider={handleDndConsider} 
		on:finalize={handleDndFinalize}
		class="flex flex-col gap-2 flex-grow overflow-y-auto custom-scroll"
	>
		{#each items as item (item.id)}
			<div animate:flip={{duration: 300}} class="bg-white/5 p-3 rounded-xl border border-white/5 group">
				<PlaysetMemberItem
					{item} 
					hasError={collidedIds.has(item.id)} 
				/>
			</div>
		{/each}
	</div>
</div>
