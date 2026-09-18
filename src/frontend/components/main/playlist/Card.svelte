<script>

import { fade } from "svelte/transition";

import { tooltip, stopPropagation } from "../../../actions";
import { highlightMatch } from "../../../utils/text";
import { icon } from "../../ui/icons";

import { editPlaylist, playPlaylist, deletePlaylist } from "../../../stores/playlist";
import { addMemberToPlayset } from "../../../stores/playsets";
import { searchQuery } from "../../../stores/selection";
import { share } from '../../../stores/share';

import Rating from "../Rating.svelte";
import Previews from "../Previews.svelte";
import HotNewBadge from "../HotNewBadge.svelte";

export let item;
export let canEdit = true;
export let isEditing = false;
export let isSelected = false;
export let onSelect;
export let onDragStart;
export let onDragEnd;
export let openContextMenu;

let addedRecently = false;

function formatDescription(item) {
	return `${item.genre} • ${item.track_count} tracks`;
}

function handleShare() {
	share.set({ type: 'playlist', item });
}

function handleAdd() {
	addedRecently = true;
	setTimeout(() => addedRecently = false, 1500);

	const member = { ...item, 
		type: 'playlist'
	};

	addMemberToPlayset(null, member);
}

function handleClick(e) {

	if (e.ctrlKey || e.metaKey || e.shiftKey)
		onSelect?.(item, e);
	else
		playPlaylist(item);
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
	<button class="menu-item" onclick={handleContextMenuAction(() => playPlaylist(item, true))}>
		<i class="fa-solid fa-play text-pulse-accent"></i>
		<span>Play</span>
	</button>
	<button class="menu-item" onclick={handleContextMenuAction(playPlaylist)}>
		<i class="fa-solid fa-layer-group text-pulse-accent"></i>
		<span>Enqueue</span>
	</button>

	{#if __PLATFORM__ === 'desktop'}
		<button class="menu-item" onclick={handleContextMenuAction(handleShare)}>
			<i class="fa-solid fa-share-nodes text-purple-400"></i>
			<span>Share</span>
		</button>
		<div class="h-px bg-white/5 my-1"></div>
		<button onclick={handleContextMenuAction(editPlaylist)} class="menu-item">
			<i class="fa-solid fa-pen-to-square text-orange-400"></i>
			<span>Edit</span>
		</button>
		<button onclick={handleContextMenuAction(deletePlaylist)} class="menu-item hover:text-red-500">
			<i class="fa-solid fa-trash-can text-red-400"></i>
			<span>Delete</span>
		</button>
	{/if}
{/snippet}

<div 
	role="button" tabindex="0"
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
				<button class="text-gray-200 hover:bg-red-500/20 hover:text-red-500"
					onclick={stopPropagation(() => deletePlaylist(item))}
					use:tooltip={"Remove"}
				>
					<i class="fa-solid fa-trash"></i>
				</button>
			</div>
		{/if}
	{/if}

	<!-- 2x2 Cover Grid -->
	<div class="preview">
		<Previews {item} />

		<!-- RATING BADGE (Top Right) -->
		{#if item.total_rating > 0}
			<Rating rating={item.total_rating} />
		{/if}
		
		<!-- Hover Controls -->
		<div class="overlay gap-1">
			<button class="button"
				onclick={stopPropagation(() => playPlaylist(item, true))}
				use:tooltip={"Play now"}
			>
				<i class="fa-solid fa-play ml-1"></i>
			</button>

			{#if canEdit}
				<button 
					onclick={stopPropagation(() => editPlaylist(item))} 
					use:tooltip={"Edit"}
					class="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
				>
					<i class="fa-solid fa-pen-to-square text-xs"></i>
				</button>
			{/if}
		</div>
	</div>

	<div class="mt-4 px-1">
		<div class="flex items-center text-sm">
			<h3 class="flex-grow font-bold text-pulse-white truncate">
				{@html highlightMatch(item.name, $searchQuery)}
			</h3>
			{@html icon(item.icon)}
		</div>
		<p class="text-[10px] text-gray-500 uppercase font-bold tracking-tighter mt-0.5">
			{formatDescription(item)}
		</p>
	</div>
</div>
