<script>

import { slide,  fade } from 'svelte/transition';

import { tooltip, stopPropagation } from '../../actions';

import List from './List.svelte';
import Badge from './Badge.svelte';


let {
	ItemComponent,
	title = '',
	icon = '',
	iconColor = '',
	items,
	selectedItem,
	showEmpty = false,
	hideEmpty = false,
	reorder = false,
	visibleItems,
	canAdd = false,
	dropAccept,
	onSelect,
	onDrop,
	onNew,
	onRename,

	actions,
	head,
	itemActions,
    contextMenu,
} = $props();

let count = $derived(
	Array.isArray(items) ? items.length : ($items?.length || 0)
);


// UI state
let isOpen = $state(true);
let newItemName = $state('');


function autofocus(node) {
    queueMicrotask(() => node.focus());
}


function handleAdd() {
	const name = newItemName.trim();
	if (!name) return;

	onNew?.(name);
	newItemName = '';
}

function handleCancelAdd() {
	newItemName = '';
	canAdd = false;
}

function onKeyAdd(e) {
	if (e.key === 'Enter') handleAdd();
	if (e.key === 'Escape') newItemName = '';
}

function onKeyDown(e) {
	// console.debug('List on key down:', e.key);

	if (e.key === 'Escape') {
		canAdd = false;
	}
}

</script>

{#if !(hideEmpty && count === 0)}
<div class="group/list flex flex-col mb-1 select-none" onkeydown={onKeyDown}>

	{#if title}
		<div
			class="group/item flex items-center gap-2 p-2 mb-1 bg-pulse-white/1 border border-pulse-white/2 hover:bg-pulse-white/5 rounded-md"
			onclick={() => isOpen = !isOpen}
		>
			<i class="fa-solid fa-angle-down text-[10px] {isOpen ? '' : '-rotate-90'}"></i>
			<i class="fa-solid {icon} {iconColor} text-xs"></i>

			<span class="flex-grow text-xs font-bold uppercase text-gray-400 truncate">
				{title}
			</span>

			<div class="flex items-center gap-2 h-5">
				<div class="hidden group-hover/item:flex pr-1 gap-2" onclick={stopPropagation}>
					{@render actions?.()}
				</div>
				<div class="group-hover/item:hidden flex">
					<Badge {count} />
				</div>
			</div>
		</div>
	{/if}

	{#if isOpen || canAdd}
		<div transition:slide={{ duration: 200 }} class="flex flex-col flex-grow">

			{#if canAdd}
				<div class="relative p-2 my-1 bg-white/5 rounded-md border border-pulse-accent/30 transition:slide">
					<input 
						use:autofocus
						bind:value={newItemName}
						onkeydown={onKeyAdd}
						placeholder="Add new item..."
						class="w-full bg-transparent border-none outline-none text-sm text-pulse-white placeholder:text-gray-600"
						spellcheck="false"
					/>
					<button 
						onclick={stopPropagation(handleCancelAdd)}
						transition:fade={{ duration: 150 }}
						class="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-white/10 hover:text-white transition-all"
						use:tooltip={"Cancel"}
					>
						<i class="fa-solid fa-circle-xmark text-sm"></i>
					</button>
				</div>
			{/if}

			{@render head?.()}

			<List 
				{ItemComponent}
				{items}
				{selectedItem}
				{showEmpty}
				{reorder}
				{visibleItems}
				{dropAccept}
				{onSelect}
				{onDrop}
				{onRename}
				{contextMenu}
				{itemActions}
			/>
		</div>
	{/if}
</div>
{/if}
