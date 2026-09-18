<script>

import { tooltip } from '../../../actions';

import { highlightMatch } from '../../../utils/text';
import { formatDuration, formatDescriptionHtml } from "../../../utils/format";

import { playTrack, currentTrack } from '../../../stores/play';
import { tracks } from '../../../stores/remote/downloads';

import VideoPreview from '../../ui/VideoPreview.svelte';
import Rating from '../RatingStars.svelte';
import CircleProgress from "../CircleProgress.svelte";

export let item;
export let isSelected = false;
export let searchQuery = '';
export let onDownload;

const isNew = !item.created_at || (item.rating == 0 && Date.isToday(item.created_at));
const downloadId = `${item.remote}_${item.id}`;

let isHovered = false;
let hoverTimeout;

$: activeDownload = $tracks[downloadId]; 

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

function handleDownload() {
	onDownload?.('track', item);
}
	
</script>


<div 
	role="button" tabindex="0"
	on:mouseenter={onHover}
	on:mouseleave={onUnhover}
	on:click|stopPropagation={() => playTrack(item)}
	on:keydown={(e) => e.key === 'Enter' && playTrack(item)}
	class="group relative rounded-lg p-3 transition-all cursor-pointer active:cursor-grabbing {isSelected ? 'bg-pulse-accent/10 border-pulse-accent' : 'bg-pulse-white/5 border-transparent hover:bg-pulse-white/10'}"
>
	
	{#if isNew}
		<div class="absolute -top-1 -left-1 z-20 bg-pulse-accent/40 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
			NEW
		</div>
	{/if}

	<!-- IMAGE AREA -->
	<div class="relative aspect-square bg-black/40 rounded-lg overflow-hidden mb-3 shadow-inner">
		{#if item.type === 'video' && (isHovered && item.id != $currentTrack?.id)}
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

		
		{#if activeDownload}
			<CircleProgress progress={activeDownload.progress} />
		{:else}
			<!-- Hover Play Overlay -->
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
			<div class="absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded">
				<button class="h-6 w-6 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-500/20 text-gray-400 hover:text-purple-500"
					on:click|stopPropagation={handleDownload}
					use:tooltip={"Download"}
				>
					<i class="fa-solid fa-download text-xs"></i>
				</button>
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
			{@html highlightMatch(item.title, searchQuery)}
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
