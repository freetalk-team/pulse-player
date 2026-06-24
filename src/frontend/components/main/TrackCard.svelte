<script>

import { tooltip } from '../../actions';

import { isEditMode, selectedTrackIds, toggleTrackSelection, lastSelectedId, isTheaterMode, activeEditPlaylist } from '../../stores/selection';
import { addTrackToPlaylist } from '../../stores/playlist';
import { editTrack } from '../../stores/tracks';
import { playTrack, isPlaying, currentTrack } from '../../stores/play';
import { share } from '../../stores/share';

import { highlightMatch } from '../../utils/text';
import { formatDuration, formatDescriptionHtml } from "../../utils/format";

import { startDragging, stopDragging } from '../../actions';

import VideoPreview from '../ui/VideoPreview.svelte';

export let item;
export let allTracks; // Pass the current view's track list from Main
export let canEdit = true;
export let canDnd = true;
export let searchQuery;

const isNew = !item.created_at || (item.rating == 0 && Date.isToday(item.created_at));

let isHovered = false;
let hoverTimeout;

$: isSelected = $selectedTrackIds.has(item.id);

// Fake rating for UI testing (you can link this to DB later)
let rating = Math.floor(item.rating / 10);
let addedRecently = false;

function handleClick(e) {
	e.stopPropagation(); // Stop App.svelte from clearing selection

	if (e.ctrlKey || e.metaKey || e.shiftKey) {
		// 1. MODIFIER CLICK: Just handle selection
		toggleTrackSelection(item.id, e.ctrlKey || e.metaKey, e.shiftKey, allTracks);
	} else {
		// 2. REGULAR CLICK: Select this one ONLY and PLAY
		selectedTrackIds.set(new Set([item.id]));
		lastSelectedId.set(item.id);
		playTrack(item); 
	}
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

function handleDragStart(e) {

	if (false) {
		// 1. Only allow internal dragging if we are in Edit Mode
		// Or allow it always if you want to drag to Queue too!
		
		// 2. Set the data as a JSON string
		const data = JSON.stringify([track]);
		e.dataTransfer.setData('pulse/tracks', data);
		
		// 3. Set the drag image (optional, but looks pro)
		e.dataTransfer.effectAllowed = 'copy';
		
		// Optional: Add a class to the body to change cursor globally
		document.body.classList.add('is-dragging-track');

	}
	else {

		let tracksToDrag = [];

		// 1. Determine what we are dragging
		const currentSelection = $selectedTrackIds;
		if (currentSelection.has(item.id)) {
			// Drag all selected tracks from the store
			tracksToDrag = allTracks.filter(t => currentSelection.has(t.id));
		} else {
			// Drag only this one
			tracksToDrag = [item];
		}

		startDragging(e, tracksToDrag, 'tracks');
	}
}

function addTrackToActivePlaylist() {
	addedRecently = true;
	setTimeout(() => addedRecently = false, 1500);

	const selection = $selectedTrackIds;
	const tracks = [];
	
	if (selection.has(item.id) && selection.size > 1) {
		// ADD BATCH
		tracks.push(...allTracks.filter(t => selection.has(t.id)));
	} else {
		// ADD SINGLE
		tracks.push(item);
	}

	addTrackToPlaylist(null, tracks);
}

function handleShare() {
	share.set({ type: 'track', item });
}

</script>

<div 
	draggable="{canDnd ? 'true': 'false'}"
	on:dragstart={handleDragStart}
	on:dragend={stopDragging}
	on:mouseenter={onHover}
	on:mouseleave={onUnhover}
	role="button" tabindex="0"
	on:click={handleClick}
	on:keydown={(e) => e.key === 'Enter' && playTrack(item)}
	class="group relative rounded-lg p-3 transition-all cursor-pointer active:cursor-grabbing {isSelected ? 'bg-pulse-accent/10 border-pulse-accent' : 'bg-pulse-white/5 border-transparent hover:bg-pulse-white/10'}"
>
	{#if $isEditMode}
		<button 
			aria-label="Add"
			on:click|stopPropagation={() => addTrackToActivePlaylist(item)}
			class="absolute top-2 right-2 z-20 w-8 h-8 bg-pulse-accent text-black rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-xl"
		>
			<i class="fa-solid {addedRecently ? 'fa-check' : 'fa-plus'}"></i>
		</button>
	{/if}
	{#if isNew}
		<div class="absolute -top-1 -left-1 z-20 bg-pulse-accent/40 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
			NEW
		</div>
	{/if}

	<!-- IMAGE AREA -->
	<div class="relative aspect-square bg-black/40 rounded-lg overflow-hidden mb-3 shadow-inner">
		{#if item.type === 'video' && (isHovered || ($currentTrack?.id === item.id && $isPlaying && $isTheaterMode))}
			<!-- 
			We only show the video in the card if:
			1. The user hovers (Preview)
			2. OR it's playing and we are in FULL Theater mode (where the Strip is hidden)
			-->
			<VideoPreview track={item} active={true} />
			
			<div class="absolute inset-0 bg-pulse-accent/10 pointer-events-none border-2 border-pulse-accent rounded-md"></div>
		{:else if item.thumb_path}
			<img
				draggable="false"
				src="{platform.resolve(item.thumb_path)}"
				class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
				alt="" 
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center text-gray-800">
				<i class="fa-solid {item.type === 'video' ? 'fa-video' : 'fa-music'} text-4xl"></i>
			</div>
		{/if}

		<!-- Hover Play Overlay -->
		{#if !$isEditMode}
			<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
				<button
					on:click|stopPropagation={() => playTrack(item, true)}
					use:tooltip={"Play now"}
					class="w-12 h-12 bg-pulse-accent text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
				>
					<i class="fa-solid fa-play ml-1"></i>
				</button>
				<!-- <div class="w-12 h-12 bg-pulse-accent rounded-full flex items-center justify-center text-black shadow-2xl scale-75 group-hover:scale-100 transition-transform">
					<i class="fa-solid fa-play text-xl ml-1"></i>
				</div> -->
			</div>
			{#if canEdit}
				<div class="opacity-0 group-hover:opacity-100 transition-opacity p1 bg-black/30 rounded absolute top-1 right-1 flex items-center">
					<button class="h-6 w-6 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-500/20 text-gray-400 hover:text-purple-500"
						on:click|stopPropagation={handleShare}
						use:tooltip={"Share"}
					>
						<i class="fa-solid fa-share-nodes text-xs"></i>
					</button>
					<button class="h-6 w-6 rounded-full flex items-center justify-center shadow-lg hover:bg-orange-500/20 text-gray-400 hover:text-orange-500"
						on:click|stopPropagation={() => editTrack.set(item)}
						use:tooltip={"Edit"}
					>
						<i class="fa-solid fa-pen-to-square text-xs"></i>
					</button>
				</div>
			{/if}
		{/if}

		<!-- QUALITY BADGES (Top Row) -->
		<!-- <div class="absolute top-2 left-2 flex gap-1 pointer-events-none">
			{#if item.quality}
				<span class="px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-black text-white rounded uppercase tracking-tighter">
					{item.quality}
				</span>
			{/if}
			
			{#if item.fps}
				<span class="px-1.5 py-0.5 bg-pulse-accent/20 backdrop-blur-md border border-pulse-accent/30 text-[8px] font-black text-pulse-accent rounded uppercase tracking-tighter">
					{item.fps} FPS
				</span>
			{/if}
		</div> -->
		
		<!-- Duration Tag -->
		<div class="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-gray-300 border border-white/10">
			{formatDuration(item.duration)}
		</div>
	</div>

	<!-- TEXT INFO -->
	<div class="px-1">
		<h4 class="text-sm font-bold truncate mb-0.5" use:tooltip={item.title}>
			{@html highlightMatch(item.title, searchQuery)}
		</h4>
		
		<p class="text-[10px] text-gray-400 truncate mb-1">
			{@html formatDescriptionHtml(item)}
		</p>

		<!-- RATING & TYPE -->
		<div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
			<div class="flex gap-0.5 text-[8px]">
				{#each Array(5) as _, i}
					<i class="fa-solid fa-star {i < rating ? 'text-pulse-accent' : 'text-gray-700'}"></i>
				{/each}
			</div>
			<i class="fa-solid {item.type === 'video' ? 'fa-film text-purple-400' : 'fa-music text-blue-400'} text-[10px] opacity-50"></i>
		</div>
	</div>
</div>

<style>

/* Change cursor globally during drag to show it's an internal move */
:global(body.is-dragging-track) {
	cursor: copying !important;
}

</style>