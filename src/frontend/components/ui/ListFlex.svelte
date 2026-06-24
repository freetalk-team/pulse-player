<script>

import { onMount } from 'svelte';
import { slide, fade, fly } from 'svelte/transition';
import { flip } from 'svelte/animate';
import Sortable from 'sortablejs';


import { clickOutside, draggingType } from '../../actions';

import Badge from './Badge.svelte';

export let title = '';
export let icon = '';
export let iconColor = '';
export let items; // store OR array
export let itemComponent;
export let selectedItem;
export let showEmpty = '';
export let hideEmpty = false;

// behavior
export let reorder = false;
export let visibleItems = null;
export let canAdd = false;
export let dropAccept;

// callbacks (ALL LOGIC OUTSIDE)
export let onSelect = null;
export let onDrop = null;
export let onNew = null;
export let onRename = () => {};
export let onReorder = moveItem;
// export let contextMenu = null;

// UI state
let isOpen = true;
let expanded = false;
let newItemName = '';

// let selectedId = null;
let dragOverId = null;
let dropNotAllowed = false;
let dropped = {}; // reactive object (NOT Map)

let el;
let draggedEl = null;

let contextItem = null;
let contextPos = { x: 0, y: 0 };

let renamingItem = null;

// ✅ reactive items (store OR array)
$: list = Array.isArray(items)
	? items
	: items
		? $items
		: [];

$: selectedId = $selectedItem?.id;

onMount(() => {
	window.addEventListener('blur', closeMenu);
	return () => window.removeEventListener('blur', closeMenu);
});

function handleContextMenu(e, item) {
	e.preventDefault();

	let y = e.clientY;
	// If we're near the bottom, shift the menu up so it stays visible
	if (window.innerHeight - y < 200) y -= 150; 

	contextItem = item;
	contextPos = { x: e.clientX, y };
}

function closeMenu() {
	contextItem = null;
}

// function executeContext(callback) {
// 	callback(contextItem);
// 	closeMenu();
// }

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

function onItemRename(item, name) {
	renamingItem = null;
	onRename(item, name);
}

function handleAdd() {
	const name = newItemName.trim();
	if (!name) return;

	onNew?.(name);
	newItemName = '';
}

function onKeyAdd(e) {
	if (e.key === 'Enter') handleAdd();
	if (e.key === 'Escape') newItemName = '';
}

function handleSelect(item) {
	if (selectedId === item.id) return;

	if (!selectedItem)
		selectedId = item.id;

	onSelect?.(item);
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

	event.preventDefault();

	dragOverId = null;
	dropNotAllowed = false;

	const dt = event.dataTransfer;
	const data = dt.getData(`pulse/${dropAccept}`);

	if (!data)
		return;

	const payload = JSON.parse(data);

	// ✅ reactive update
	dropped = { ...dropped, [item.id]: true };

	setTimeout(() => {
		dropped = { ...dropped, [item.id]: false };
	}, 1500);

	onDrop(item, payload);
}

function sortable(node) {
	if (!reorder) return;

	const s = Sortable.create(node, {
		animation: 150,
		forceFallback: true,

		onStart: (evt) => {
			draggedEl = evt.item;
			draggedEl.style.visibility = 'hidden';
		},

		onEnd: (evt) => {
			draggedEl.style.visibility = 'visible';
			draggedEl = null;

			// requestAnimationFrame(() => {
    		// 	onReorder(from, to);
  			// });

			const { oldIndex, newIndex } = evt;

			if (oldIndex === newIndex) return;

			// const item = el.children[newIndex];
			// const ref = el.children[oldIndex];

			// if (oldIndex < newIndex)
			// 	el.insertBefore(item, ref);
			// else
			// 	el.insertBefore(item, ref.nextSibling);

			onReorder(oldIndex, newIndex);
		}
	});

	// const s = Sortable.create(node, {
	// 	animation: 150,
	// 	forceFallback: true,
	// 	ghostClass: 'sortable-ghost',

	// 	onStart: (evt) => {
	// 		draggedEl = evt.item;
	// 		draggedEl.style.visibility = 'hidden';
	// 	},

	// 	onUpdate: (evt) => {
	// 		onReorder(evt.oldIndex, evt.newIndex);
	// 	},

	// 	onEnd: () => {
	// 		draggedEl.style.visibility = 'visible';
	// 		draggedEl = null;
	// 	}
	// });

	return { destroy: () => s.destroy() };
}

function onKeyDown(e) {
	if (e.key === 'Escape') {

		if (contextItem) {
			e.preventDefault();
			closeMenu();
		}

		renamingItem = null;
	}
}

function move(index, offset=1) {
	const to = index + offset;
	onReorder(index, to);
}

function moveById(id, offset) {
  const index = list.findIndex(i => i.id === id);
  const to = index + offset;

  console.log('Index:', index);

  if (to < 0 || to >= list.length) return;

  moveItem(index, to);
}

function moveItem(from, to) {

	items.update(current => {
		const [moved] = current.splice(from, 1);
		current.splice(to, 0, moved);

		return current;

	});

	// const current = [...list];

	// const [moved] = current.splice(from, 1);
	// current.splice(to, 0, moved);

	// if (items?.set) 
	// 	items.set(current);
	// else 
	// 	items = current;
}

function remove(index, count=1) {
	const current = [...list];
	current.splice(index, count);

	if (items?.set) 
		items.set(current);
	else 
		items = current;
}

const getIndex = (id) => {
	const i = list.findIndex(item => item.id === id);
	console.log('Index:', i, id);
	return i;
}

</script>

<style>

.sortable-ghost {
	opacity: 0 !important;
}

</style>

<svelte:window 
	on:keydown={onKeyDown}
	on:wheel={closeMenu}
/>

{#if contextItem}
	<div
		class="fixed z-100 w-48 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl py-1 overflow-hidden"
		style="top: {contextPos.y}px; left: {contextPos.x}px;"
		transition:fly={{ y: 5, duration: 150 }}
		on:click|stopPropagation
		use:clickOutside={closeMenu}
	>
		<slot name="context_menu" item={contextItem} close={closeMenu} {execute} {rename} />
	</div>
{/if}

{#if !(hideEmpty && list.length == 0)}

<div class="group/list flex flex-col mb-2 select-none">
	<!-- HEADER -->

	{#if title}
		<div
			class="group/item flex items-center gap-2 p-2 mb-1 cursor-pointer hover:bg-pulse-white/5 rounded-md"
			on:click={() => isOpen = !isOpen}
		>
			<i class="fa-solid fa-angle-down text-[10px] {isOpen ? '' : '-rotate-90'}"></i>
			<i class="fa-solid {icon} {iconColor} text-xs"></i>

			<span class="flex-grow text-xs font-bold uppercase text-gray-400 truncate">
				{title}
			</span>

			<div class="flex items-center gap-2 h-5">
				
				<div class="hidden group-hover/item:flex items-center gap-2 pr-1" on:click|stopPropagation>
					<slot name="actions" />
				</div>
				<!-- TRACK COUNT (Hidden on hover) -->
				<div class="group-hover/item:hidden flex">
					<Badge count={list.length} />
				</div>
			</div>
		</div>
	{/if}

	{#if isOpen}
		<div transition:slide={{ duration: 200 }} class="flex flex-col flex-grow">

			<!-- ADD INPUT -->
			{#if canAdd}
				<div class="px-2 py-1 my-1 bg-white/5 rounded-md border border-pulse-accent/30 transition:slide">
					<input 
						bind:value={newItemName}
						on:keydown={onKeyAdd}
						on:blur={handleAdd}
						placeholder="Add new item..."
						class="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600"
						spellcheck="false"
					/>
				</div>
			{/if}

			<!-- LIST -->
			<ul bind:this={el} use:sortable class="flex flex-col gap-1 overflow-hidden"
			>
				{#each list as item, index (item.id)}

					{#if !visibleItems || index < visibleItems || expanded}
						<li
							on:click={() => handleSelect(item)}
							on:contextmenu={(e) => handleContextMenu(e, item)}
							on:dragover|preventDefault={() => handleDragOver(item)}
							on:dragleave={handleDragLeave}
							on:drop={(e) => handleDrop(e, item)}
							transition:slide={{ duration: 400 }}
							class="flex items-center "
						>
							<!-- <span class="text-gray-400">{index + 1}.</span> -->
							<svelte:component
								this={itemComponent}
								{item}
								index={index}
								isSelected={item.id === selectedId}
								isDragOver={item.id === dragOverId}
								isDropAllowed={!dropNotAllowed}
								isDropped={!!dropped[item.id]}
								isRenaming={item.id === renamingItem?.id}
								onRename={onItemRename}
							>
								<div slot="actions">
									<slot name="item_actions" {item} {index} count={list.length} {move} {remove} />
								</div>
							</svelte:component>
						</li>
					{/if}
				{/each}
			</ul>

			{#if showEmpty && list.length === 0}
				<p class="text-[10px] text-gray-600 italic p-2">{showEmpty}</p>
			{/if}

			<!-- MORE / LESS -->
			{#if visibleItems && list.length > visibleItems}
				<button
					class="text-xs text-gray-400 mt-1 hover:text-white"
					on:click={() => expanded = !expanded}
				>
					{expanded ? 'Less' : `More (${list.length - visibleItems})`}
					<i class="pl-1 fa-solid {expanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
				</button>
			{/if}
		</div>
	{/if}
</div>

{/if}