<script>
import { onMount } from 'svelte';
import { slide, fly } from 'svelte/transition';
import { dndzone } from 'svelte-dnd-action';

import { clickOutside, draggingType } from '../../actions';
import Badge from './Badge.svelte';

export let title = '';
export let icon = '';
export let iconColor = '';
export let items;
export let itemComponent;
export let selectedItem;
export let showEmpty = '';
export let hideEmpty = false;

// behavior
export let reorder = false;
export let visibleItems = null;
export let canAdd = false;
export let dropAccept;

// callbacks
export let onSelect = null;
export let onDrop = null;
export let onNew = null;
export let onRename = () => {};

// UI state
let isOpen = true;
let expanded = false;
let newItemName = '';

let dragOverId = null;
let dropNotAllowed = false;
let dropped = {};

let contextItem = null;
let contextPos = { x: 0, y: 0 };
let renamingItem = null;

// reactive list
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
  if (window.innerHeight - y < 200) y -= 150;

  contextItem = item;
  contextPos = { x: e.clientX, y };
}

function closeMenu() {
  contextItem = null;
}

function execute(callback) {
  return () => {
    callback(contextItem);
    closeMenu();
  };
}

function rename() {
  return () => {
    renamingItem = contextItem;
    closeMenu();
  };
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

  const newItems = e.detail.items;
  
  if (items?.set) items.set(newItems);
  else items = newItems;
}

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

  event.preventDefault();
  dragOverId = null;
  dropNotAllowed = false;

  const data = event.dataTransfer.getData(`pulse/${dropAccept}`);
  if (!data) return;

  const payload = JSON.parse(data);

  dropped = { ...dropped, [item.id]: true };
  setTimeout(() => {
    dropped = { ...dropped, [item.id]: false };
  }, 1500);

  onDrop(item, payload);
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
</script>

<svelte:window on:keydown={onKeyDown} on:wheel={closeMenu} />

{#if contextItem}
  <div
    class="fixed z-100 w-48 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl py-1"
    style="top: {contextPos.y}px; left: {contextPos.x}px;"
    transition:fly={{ y: 5, duration: 150 }}
    on:click|stopPropagation
    use:clickOutside={closeMenu}
  >
    <slot name="context_menu" item={contextItem} close={closeMenu} {execute} {rename} />
  </div>
{/if}

{#if !(hideEmpty && list.length === 0)}
<div class="group/list flex flex-col mb-2 select-none">

  {#if title}
    <div
      class="group/item flex items-center gap-2 p-2 cursor-pointer hover:bg-pulse-white/5 rounded-md"
      on:click={() => isOpen = !isOpen}
    >
      <i class="fa-solid fa-angle-down text-[10px] {isOpen ? '' : '-rotate-90'}"></i>
      <i class="fa-solid {icon} {iconColor} text-xs"></i>

      <span class="flex-grow text-xs font-bold uppercase text-gray-400 truncate">
        {title}
      </span>

      <div class="flex items-center gap-2 h-5">
        <div class="hidden group-hover/item:flex pr-1" on:click|stopPropagation>
          <slot name="actions" />
        </div>
        <div class="group-hover/item:hidden flex">
          <Badge count={list.length} />
        </div>
      </div>
    </div>
  {/if}

  {#if isOpen}
    <div transition:slide={{ duration: 200 }} class="flex flex-col">

      {#if canAdd}
        <div class="px-2 py-1 my-1 bg-white/5 rounded-md border border-pulse-accent/30">
          <input
            bind:value={newItemName}
            on:keydown={onKeyAdd}
            on:blur={handleAdd}
            placeholder="Add new item..."
            class="w-full bg-transparent outline-none text-sm"
          />
        </div>
      {/if}

      <!-- ✅ DND ZONE -->
      {#if reorder}
       <ul
        use:dndzone={{ items: list, flipDurationMs: 150 }}
        on:consider={handleConsider}
        on:finalize={handleDnd}
        class="flex flex-col gap-1"
      >
        {#each list as item, index (item.id)}
          {#if !visibleItems || index < visibleItems || expanded}
            <li
              on:click={() => handleSelect(item)}
              on:contextmenu={(e) => handleContextMenu(e, item)}
              on:dragover|preventDefault={() => handleDragOver(item)}
              on:dragleave={handleDragLeave}
              on:drop={(e) => handleDrop(e, item)}
              transition:slide={{ duration: 200 }}
              class="flex items-center"
            >
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
                <div slot="actions" on:click|stopPropagation>
                  <slot name="item_actions" {item} {index} count={list.length} {move} {remove} />
                </div>
              </svelte:component>
            </li>
          {/if}
        {/each}
      </ul>
      {:else}
      <ul
        class="flex flex-col gap-1"
      >
        {#each list as item, index (item.id)}
          {#if !visibleItems || index < visibleItems || expanded}
            <li
              on:click={() => handleSelect(item)}
              on:contextmenu={(e) => handleContextMenu(e, item)}
              on:dragover|preventDefault={() => handleDragOver(item)}
              on:dragleave={handleDragLeave}
              on:drop={(e) => handleDrop(e, item)}
              transition:slide={{ duration: 200 }}
              class="flex items-center"
            >
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
      {/if}

      {#if showEmpty && list.length === 0}
        <p class="text-[10px] text-gray-600 italic p-2">{showEmpty}</p>
      {/if}

      {#if visibleItems && list.length > visibleItems}
        <button
          class="text-xs text-gray-400 mt-1 hover:text-white"
          on:click={() => expanded = !expanded}
        >
          {expanded ? 'Less' : `More (${list.length - visibleItems})`}
        </button>
      {/if}
    </div>
  {/if}
</div>
{/if}
