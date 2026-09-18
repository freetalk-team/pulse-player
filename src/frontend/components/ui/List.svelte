<script>

import { onMount } from 'svelte';
import { tick } from 'svelte';

import { slide, fly } from 'svelte/transition';
import { dndzone } from 'svelte-dnd-action';

import { clickOutside, draggingType, stopPropagation, preventDefault } from '../../actions';
import { setContextMenu } from './ContextMenu.svelte';

let {
	ItemComponent,
	items,
	selectedItem,
	showEmpty = false,
	reorder = false,
	visibleItems,
	dropAccept,
	onSelect,
	onDrop,
	onRename,

	itemActions,
    contextMenu,
} = $props();


let expanded = $state(false);
let dragOverId = $state(null);
let dropNotAllowed = $state(false);
let dropped = $state({});

let contextItem = $state(null);
let contextPos = $state({ x: 0, y: 0 });
let menuElement = $state(null);
//let adjustedPos = { x: 0, y: 0 };

let renamingItem = $state(null);

// reactive list
let list = $derived(
	Array.isArray(items)
		? items
		: items ? $items : []
);

onMount(() => {
	window.addEventListener('blur', closeMenu);
	return () => window.removeEventListener('blur', closeMenu);
});

function dnd(node, options) {
	if (reorder) return dndzone(node, options);
}

async function handleContextMenu(e, item) {
	e.preventDefault();

	if (!contextMenu) return;

	setContextMenu(closeMenu);

	contextItem = item;
	contextPos = { 
		x: e.clientX, 
		// y: window.innerHeight - e.clientY < 200 ? e.clientY - 50 : e.clientY
		y: e.clientY
	};

	await tick();

	const rect = menuElement.getBoundingClientRect();

	const padding = 8;

	contextPos = {
		x: Math.max(
			padding, 
		 	Math.min(e.clientX, window.innerWidth - rect.width - padding)
		),
		y: Math.max(
			padding, 
			Math.min(e.clientY, window.innerHeight - rect.height - padding)
		)
	};
}

function closeMenu() {
	contextItem = null;
}

function execute(callback) {
	return () => {
		callback(contextItem);
		closeMenu();
	}
}

function rename() {
	return () => {
		renamingItem = contextItem;
		closeMenu();
	}
}

function removeItem() {
	return () => {
		if (items?.update) 
			items.update(list => list.filter(i => i.id != contextItem.id));
		else
			items = items.filter(i => i.id != contextItem.id);

		closeMenu();
	}
}

function onItemRename(item, name) {
	renamingItem = null;
	onRename?.(item, name);
}

function handleSelect(item) {
	if (selectedItem?.id === item.id) return;
	
	onSelect?.(item);
}

function handleConsider(e) {
	// 🚫 do NOT update store here
	// optional: ignore or use for preview only

	list = e.detail.items;
}

// 👉 DND HANDLER
function handleDnd(e) {
	if (!reorder) return;
	if (!e?.detail?.items) return; // ✅ prevent crash

	//console.debug('Handle finalize');

	const newItems = e.detail.items;
	
	if (items?.set) items.set(newItems);
	else items = newItems;
}

// function itemActionsWrapper(index, count) {
// 	return (item) => itemActions?.(item, index, count, { move, remove });
// }

// manual move (buttons)
function move(index, offset = 1) {
	const to = index + offset;

	moveItem(index, to);
}

function moveItem(from, to) {
	const current = [...list];

	const [moved] = current.splice(from, 1);
	current.splice(to, 0, moved);

	if (items?.set) 
		items.set(current);
	else 
		items = current;
}

function remove(index, count = 1) {
	const newItems = [...list];
	newItems.splice(index, count);

	if (items?.set) items.set(newItems);
	else items = newItems;
}



function handleDragOver(item) {
	if (!onDrop) return;


	dragOverId = item.id;
	dropNotAllowed = draggingType !== dropAccept;
}

function handleDragLeave() {
	dragOverId = null;
	dropNotAllowed = false;
}

function handleDrop(event, item) {
	if (!onDrop) return;
	if (dropNotAllowed) {
		dragOverId = null;
		dropNotAllowed = false;
		return;
	}

	event.preventDefault();

	dragOverId = null;
	dropNotAllowed = false;

	const dt = event.dataTransfer;
	const data = dt.getData(`pulse/${draggingType}`);

	if (!data)
		return;

	const payload = JSON.parse(data);

	// ✅ reactive update
	dropped = { ...dropped, [item.id]: true };

	setTimeout(() => {
		dropped = { ...dropped, [item.id]: false };
	}, 1500);

	onDrop(item, payload, draggingType);
}

function onKeyDown(e) {
	if (e.key === 'Escape') {
		renamingItem = null;
	}
}
	
</script>

<svelte:window on:keydown={onKeyDown} />

{#if contextItem}
	<div bind:this={menuElement}
		transition:fly={{ y: 5, duration: 150 }}
		use:clickOutside={closeMenu}
		onclick={stopPropagation}
		style="top: {contextPos.y}px; left: {contextPos.x}px;"
		class="context-menu"
	>
		{@render contextMenu?.(contextItem, { execute, rename, remove: removeItem })}
	</div>
{/if}

<ul
	use:dnd={{ items: list, flipDurationMs: 150 }}
	onconsider={handleConsider}
	onfinalize={handleDnd}
	class="flex flex-col gap-1"
>
	{#each list as item, index (item.id)}
		{#if !visibleItems || index < visibleItems || expanded}
			<li
				onclick={() => handleSelect(item)}
				oncontextmenu={(e) => handleContextMenu(e, item)}
				ondragover={preventDefault(() => handleDragOver(item))}
				ondragleave={handleDragLeave}
				ondrop={(e) => handleDrop(e, item)}
				transition:slide={{ duration: 200 }}
				class="flex items-center"
			>
				<ItemComponent
					{item}
					isSelected={item.id === selectedItem?.id}
					isDragOver={item.id === dragOverId}
					isDropAllowed={!dropNotAllowed}
					isDropped={!!dropped[item.id]}
					isRenaming={item.id === renamingItem?.id}
					onRename={onItemRename}
					actions={itemActions}
					ctx={{ 
						index, 
						count: list.length, 
						rm() { remove(this.index) }, 
						up() { move(this.index, -1) },
						down() { move(this.index, 1) },
						first() { return this.index == 0; },
						last() { return this.index == this.count - 1; }
					}}
				/>
					
			</li>
		{/if}
	{/each}
</ul>

{#if showEmpty && list.length === 0}
	<p class="text-[10px] text-gray-600 italic p-2">{showEmpty}</p>
{/if}

{#if visibleItems && list.length > visibleItems}
	<button
		class="text-xs text-gray-400 mt-1 hover:text-white"
		onclick={() => expanded = !expanded}
	>
		{expanded ? 'Less' : `More (${list.length - visibleItems})`}
	</button>
{/if}
