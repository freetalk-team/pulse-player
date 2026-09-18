<script>

import { tooltip, stopPropagation } from '../../../actions';

import { highlightMatch } from '../../../utils/text';
import { formatDuration, formatDescriptionHtml } from "../../../utils/format";

import { searchQuery } from '../../../stores/selection';
import { playTrack, enqueueTrack, currentTrack } from '../../../stores/play';
import { editTrack, removeTrack } from '../../../stores/tracks';
import { addTrackToPlaylist } from "../../../stores/playlist";
import { share } from '../../../stores/share';

import VideoPreview from '../../ui/VideoPreview.svelte';
import Rating from '../RatingStars.svelte';

let {
	item,
	isSelected = false,
	canDnd = true,
	isEditing = false,
	onSelect,
	onDragStart,
	onDragEnd = () => {},
	openContextMenu
} = $props();


const isNew = !item.created_at || (item.rating == 0 && Date.isToday(item.created_at));

let thumbPath = $state(null);
let addedRecently = $state(false);
let isHovered = $state(false);
let hoverTimeout;

if (__PLATFORM__ === 'web') {
	$effect(() => {
		const coverId = item?.cover;

		if (!coverId) {
			thumbPath = null;
			return;
		}

		let cancelled = false;

		platform.getThumb(coverId).then((url) => {
			if (cancelled) {
				// getThumb() incremented the reference count,
				// but this component no longer needs it.
				if (url) {
					platform.releaseThumb(coverId);
				}
				return;
			}

			thumbPath = url;
		});

		return () => {
			cancelled = true;

			platform.releaseThumb(coverId);
			thumbPath = null;
		};
	});
} else {
	$effect(() => {
		thumbPath = item?.thumb_path ?? null;
	});
}

function onHover() {
	hoverTimeout = setTimeout(() => {
		isHovered = true;
		hoverTimeout = null;
	}, 2000);
}

function onUnhover() {
	isHovered = false;

	clearTimeout(hoverTimeout);
	hoverTimeout = null;
}

function handleShare() {
	share.set({ type: 'track', item });
}

function handleEdit() {
	editTrack.set(item);
}

function handleRemove() {
	removeTrack(item);
}

function handleClick(e) {
	if (!(e.ctrlKey || e.metaKey || e.shiftKey))
		playTrack(item);

	onSelect?.(item, e);
}

function handleAdd() {
	addedRecently = true;
	setTimeout(() => addedRecently = false, 1500);

	addTrackToPlaylist(null, item);
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
	<button class="menu-item" onclick={handleContextMenuAction(() => playTrack(item, true))}>
		<i class="fa-solid fa-play text-pulse-accent"></i>
		<span>Play</span>
	</button>
	<button class="menu-item" onclick={handleContextMenuAction(enqueueTrack)}>
		<i class="fa-solid fa-layer-group text-pulse-accent"></i>
		<span>Enqueue</span>
	</button>

	{#if __PLATFORM__ === 'desktop'}
		<button class="menu-item" onclick={handleContextMenuAction(handleShare)}>
			<i class="fa-solid fa-share-nodes text-purple-400"></i>
			<span>Share</span>
		</button>
		<div class="h-px bg-white/5 my-1"></div>
		<button onclick={handleContextMenuAction(handleEdit)} class="menu-item">
			<i class="fa-solid fa-pen-to-square text-orange-400"></i>
			<span>Edit</span>
		</button>
		<button onclick={handleContextMenuAction(handleRemove)} class="menu-item hover:text-red-500">
			<i class="fa-solid fa-trash-can text-red-400"></i>
			<span>Delete</span>
		</button>
	{/if}
{/snippet}

<div 
	draggable="{canDnd ? 'true': 'false'}"
	ondragstart={handleDragStart}
	ondragend={onDragEnd}
	onmouseenter={onHover}
	onmouseleave={onUnhover}
	role="button" tabindex="0"
	onclick={stopPropagation(handleClick)}
	onkeydown={(e) => e.key === 'Enter' && playTrack(item)}
	oncontextmenu={handleContextMenu}
	class="group card"
	class:selected={isSelected}
>
	{#if isEditing}
		<button 
			aria-label="Add"
			onclick={stopPropagation(handleAdd)}
			class="absolute top-2 right-2 z-20 w-8 h-8 bg-pulse-accent text-black rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-xl"
		>
			<i class="fa-solid {addedRecently ? 'fa-check' : 'fa-plus'}"></i>
		</button>
	{:else if isNew}
		<div class="badge-left bg-pulse-accent/40">
			NEW
		</div>

		
		
	{/if}

	{#if __PLATFORM__ !== 'remote'}
		{#if !isEditing}
		
			<div class="actions">
				{#if __PLATFORM__ === 'desktop'}
					<button class="text-gray-200 hover:bg-purple-500/20 hover:text-purple-500"
						onclick={stopPropagation(handleShare)}
						use:tooltip={"Share"}
					>
						<i class="fa-solid fa-share-nodes"></i>
					</button>
					<button class="text-gray-200 hover:bg-orange-500/20 hover:text-orange-500"
						onclick={stopPropagation(handleEdit)}
						use:tooltip={"Edit"}
					>
						<i class="fa-solid fa-pen-to-square"></i>
					</button>
				{/if}
				<button class="text-gray-200 hover:bg-red-500/20 hover:text-red-500"
					onclick={stopPropagation(handleRemove)}
					use:tooltip={"Remove"}
				>
					<i class="fa-solid fa-trash"></i>
				</button>
			</div>
		{/if}
	{/if}

	<!-- IMAGE AREA -->
	<div class="thumb">
		{#if __PLATFORM__ !== 'web' && 
			item.type === 'video' && 
			isHovered && 
			item.id != $currentTrack?.id}
			<!-- 
			We only show the video in the card if:
			1. The user hovers (Preview)
			2. OR it's playing and we are in FULL Theater mode (where the Strip is hidden)
			-->
			<VideoPreview track={item} active={true} />
			
			<div class="absolute inset-0 bg-pulse-accent/10 pointer-events-none border-2 border-pulse-accent rounded-md"></div>
		{:else if thumbPath}
			<img
				draggable="false"
				src="{platform.resolve(thumbPath)}"
				alt="" 
			/>
		{:else}
			<div class="icon">
				<i class="fa-solid {item.type === 'video' ? 'fa-video' : 'fa-music'}"></i>
			</div>
		{/if}

		{#if !isEditing}
			<div class="overlay">
				<button
					onclick={stopPropagation(() => playTrack(item, true))}
					use:tooltip={"Play now"}
					class="button"
				>
					<i class="fa-solid fa-play"></i>
				</button>
				<!-- <div class="w-12 h-12 bg-pulse-accent rounded-full flex items-center justify-center text-black shadow-2xl scale-75 group-hover:scale-100 transition-transform">
					<i class="fa-solid fa-play text-xl ml-1"></i>
				</div> -->
			</div>
		{/if}

		<!-- Duration Tag -->
		<div class="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-gray-300 border border-white/10">
			{formatDuration(item.duration)}
		</div>
	</div>

	<!-- TEXT INFO -->
	<div class="px-1">
		<h4 class="text-sm font-bold truncate mb-0.5" use:tooltip={item.title}>
			{@html highlightMatch(item.title, $searchQuery)}
		</h4>
		
		<p class="text-[10px] text-gray-400 truncate mb-1">
			{@html formatDescriptionHtml(item)}
		</p>

		<!-- RATING & TYPE -->
		<div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
			<Rating rating={item.rating} />
			<i class="fa-solid {item.type === 'video' ? 'fa-film text-purple-400' : 'fa-music text-blue-400'} text-[10px] opacity-50"></i>
		</div>
	</div>
</div>
