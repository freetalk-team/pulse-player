<script>

import { fade } from "svelte/transition";

import { tooltip, stopPropagation, startDragging, stopDragging } from "../../../actions";
import { highlightMatch } from "../../../utils/text";
import { icon } from "../../ui/icons";

import { editPlayset, playPlayset, deletePlayset } from "../../../stores/playsets";
import { searchQuery } from "../../../stores/selection";
import { share } from '../../../stores/share';

import Rating from "../Rating.svelte";
import Previews from "../Previews.svelte";
import HotNewBadge from "../HotNewBadge.svelte";

export let item;
export let canEdit = true;
export let openContextMenu;

// const icon = itemType === 'playlist' ? 'fa-list-ul text-orange-400' : 'fa-clock text-blue-400';

function formatDescription() {
	return `${item.genre} • ${item.member_count} collections`;
}

function handleDragStart(e) {
	startDragging(e, [item], 'sets');
}

function handleShare() {
	share.set({ type: 'playset', item });
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
	<button class="menu-item" onclick={handleContextMenuAction(() => playPlayset(item, true))}>
		<i class="fa-solid fa-play text-pulse-accent"></i>
		<span>Play</span>
	</button>
	<button class="menu-item" onclick={handleContextMenuAction(playPlayset)}>
		<i class="fa-solid fa-layer-group text-pulse-accent"></i>
		<span>Enqueue</span>
	</button>

	{#if __PLATFORM__ === 'desktop'}
		<button class="menu-item" onclick={handleContextMenuAction(handleShare)}>
			<i class="fa-solid fa-share-nodes text-purple-400"></i>
			<span>Share</span>
		</button>
		<div class="h-px bg-white/5 my-1"></div>
		<button onclick={handleContextMenuAction(editPlayset)} class="menu-item">
			<i class="fa-solid fa-pen-to-square text-orange-400"></i>
			<span>Edit</span>
		</button>
		<button onclick={handleContextMenuAction(deletePlayset)} class="menu-item hover:text-red-500">
			<i class="fa-solid fa-trash-can text-red-400"></i>
			<span>Delete</span>
		</button>
	{/if}
{/snippet}

<div 
	class="group card"
	in:fade={{ duration: 400 }}
	draggable="true"
	ondragstart={handleDragStart}
	ondragend={stopDragging}
	oncontextmenu={handleContextMenu}
>
	<div class="absolute -top-1 -right-1 z-20 group-hover:hidden">
		<HotNewBadge {item} />
	</div>

	<div class="actions">
		<button class="text-gray-200 hover:bg-purple-500/20 hover:text-purple-500"
			onclick={stopPropagation(handleShare)}
			use:tooltip={"Share"}
		>
			<i class="fa-solid fa-share-nodes"></i>
		</button>
		<button class="text-gray-200 hover:bg-orange-500/20 hover:text-red-500"
			onclick={stopPropagation(() => deletePlayset(item))}
			use:tooltip={"Remove"}
		>
			<i class="fa-solid fa-trash"></i>
		</button>
	</div>

	<!-- 2x2 Cover Grid -->
	<div class="preview">
		<Previews {item} />

		<!-- RATING BADGE (Top Right) -->
		{#if item.total_rating > 0}
			<Rating rating={item.total_rating} />
		{/if}
		
		<!-- Hover Controls -->
		<div class="overlay gap-2">
			<button
				onclick={stopPropagation(() => playPlayset(item))}
				use:tooltip={"Play now"}
				class="button"
			>
				<i class="fa-solid fa-play"></i>
			</button>

			{#if canEdit}
				<button 
					onclick={stopPropagation(() => editPlayset(item))} 
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
