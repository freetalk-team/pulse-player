<script>

import { onMount, onDestroy } from "svelte";
import { fade } from "svelte/transition";

import { tooltip, stopPropagation } from "../../../actions";
import { highlightMatch } from "../../../utils/text";
import { formatDescriptionHtml } from "../../../utils/format";

import { searchQuery } from "../../../stores/selection";
import { playAlbum, deleteAlbum } from "../../../stores/albums";
import { addMemberToPlayset } from "../../../stores/playsets";
import { share } from '../../../stores/share';


import Rating from "../Rating.svelte";
import HotNewBadge from "../HotNewBadge.svelte";

export let item;
export let isEditing = false;
export let isSelected = false;
export let onSelect;
export let onDragStart;
export let onDragEnd;
export let openContextMenu;

let addedRecently = false;

if (__PLATFORM__ === 'web') {
	onMount(async () => {
		if (item.cover)
			item.cover_path = await platform.getThumb(item.cover);
	});

	onDestroy(() => {
		if (item.cover)
			platform.releaseThumb(item.cover);
	});
}

function handleShare() {
	share.set({ type: 'album', item });
}

function handleAdd() {
	addedRecently = true;
	setTimeout(() => addedRecently = false, 1500);

	const member = { ...item, 
		type: 'album', 
		icon: 'fa-record-vinyl slate'
	};

	addMemberToPlayset(null, member);
}

function handleClick(e) {

	if (e.ctrlKey || e.metaKey || e.shiftKey)
		onSelect?.(item, e);
	else
		playAlbum(item);
}

function handleDragStart(e) {
	onDragStart?.(item, e);
}

function handleContextMenu(e) {
	openContextMenu?.(e, item, contextMenuContent);
}

function handleContextMenuAction(fn) {
	return (e) => {
		openContextMenu(e);
		fn(item);
	}
}

</script>

{#snippet contextMenuContent(item)}
	<button class="menu-item" onclick={handleContextMenuAction(() => playAlbum(item, true))}>
		<i class="fa-solid fa-play text-pulse-accent"></i>
		<span>Play</span>
	</button>
	<button class="menu-item" onclick={handleContextMenuAction(playAlbum)}>
		<i class="fa-solid fa-layer-group text-pulse-accent"></i>
		<span>Enqueue</span>
	</button>
	{#if __PLATFORM__ === 'desktop'}
		<button class="menu-item" onclick={handleContextMenuAction(handleShare)}>
			<i class="fa-solid fa-share-nodes text-purple-400"></i>
			<span>Share</span>
		</button>
		<div class="h-px bg-white/5 my-1"></div>
		<button onclick={handleContextMenuAction(deleteAlbum)} class="menu-item hover:text-red-500">
			<i class="fa-solid fa-trash-can text-red-400"></i>
			<span>Delete</span>
		</button>
	{/if}
{/snippet}

<div 
	role="button" 
	tabindex="0"
	draggable="true"
	class="group card"
	class:selected={isSelected}
	in:fade={{ duration: 400 }}
	onclick={stopPropagation(handleClick)}
	ondragstart={handleDragStart}
	ondragend={onDragEnd}
	oncontextmenu={handleContextMenu}
>

	{#if isEditing}
		<button 
			aria-label="Add"
			onclick={stopPropagation(handleAdd)}
			use:tooltip={"Add to playset"}
			class="absolute top-2 right-2 z-20 w-8 h-8 bg-pulse-accent text-black rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-xl"
		>
			<i class="fa-solid {addedRecently ? 'fa-check' : 'fa-plus'}"></i>
		</button>
	{:else}
		<div class="absolute -top-1 -right-1 z-20 group-hover:hidden">
			<HotNewBadge {item} />
		</div>

		{#if __PLATFORM__ === 'desktop'}
			<div class="actions">
				<button class="text-gray-200 hover:bg-purple-500/20 hover:text-purple-500"
					onclick={stopPropagation(handleShare)}
					use:tooltip={"Share"}
				>
					<i class="fa-solid fa-share-nodes"></i>
				</button>
				<button class="text-gray-200 hover:bg-orange-500/20 hover:text-red-500"
					onclick={stopPropagation(() => deleteAlbum(item))}
					use:tooltip={"Remove"}
				>
					<i class="fa-solid fa-trash"></i>
				</button>
			</div>
		{/if}
	{/if}

	<!-- Album Cover with Glow -->
	<div class="thumb">
		{#if item.cover_path}
			<img 
				src="{platform.resolve(item.cover_path)}" 
				alt={item.name} 
			/>
		{:else}
			<div class="icon">
				<i class="fa-solid fa-record-vinyl text-pulse-white/20"></i>
			</div>
		{/if}

		<div class="overlay">
			<button 
				onclick={stopPropagation(() => playAlbum(item, true))}
				use:tooltip={"Play now"}
				class="button"
			>
				<i class="fa-solid fa-play"></i>
			</button>
		</div>
		
	</div>

	<!-- RATING BADGE (Top Right) -->
	{#if item.total_rating > 0}
		<Rating rating={item.total_rating} />
	{/if}

	<!-- Metadata -->
	<div class="mt-4 px-1">
		<h3 class="font-bold text-pulse-white truncate text-sm">
			{@html highlightMatch(item.name, $searchQuery)}
		</h3>
		<p class="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5 truncate">
			{@html formatDescriptionHtml(item)}
		</p>
	</div>
</div>
