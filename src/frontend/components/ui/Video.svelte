<script>

import { onDestroy } from 'svelte';

import { tooltip } from '../../actions';

import { videoElement, isVideoView, videoMode, isPlaying, volume, toggleMute, playNext, playPrev, togglePlayback, currentTime, duration, seek } from '../../stores/play';
import { isTheaterMode } from '../../stores/selection';
import { videoPortalRect, mainViewportRect } from '../../stores/layout';

let el;
let innerWidth;
let innerHeight;
let fitMode = 'object-contain'; // default to contain

const TITLEBAR_HEIGHT = 32;

$: if (el) videoElement.set(el);

// 1. Calculate the Target Position
$: target = $isTheaterMode 
		? { 
				top: TITLEBAR_HEIGHT, 
				left: 0, 
				width: innerWidth, 
				height: innerHeight - TITLEBAR_HEIGHT 
		  } 
		: ($videoPortalRect || { top: -2000, left: -2000, width: 1, height: 1 });

// 2. Calculate the Clipping (Only clip when NOT in Theater Mode)
$: clipTop = !$isTheaterMode && $videoPortalRect && $mainViewportRect 
	? Math.max(0, $mainViewportRect.top - $videoPortalRect.top) 
	: 0;

$: clipBottom = !$isTheaterMode && $videoPortalRect && $mainViewportRect 
	? Math.max(0, $videoPortalRect.bottom - $mainViewportRect.bottom) 
	: 0;

$: isClippedByHeader = clipTop > 0;

$: showVideo = $isVideoView && $videoMode;

function handleVideoScroll(e) {
	// 1. Find the actual scrollable container in the Main area
	const scrollContainer = document.querySelector('main .custom-scroll');
	
	if (scrollContainer) {
		// 2. Manually apply the scroll delta to the container
		scrollContainer.scrollTop += e.deltaY;
		
		// 3. Prevent the video from doing its default "nothing" or internal volume scroll
		// unless you want to keep the volume scroll we added earlier!
	}
}

function toggleFitMode() {
	fitMode = fitMode === 'object-contain' ? 'object-cover' : 'object-contain';
}

let showControls = true;
let hideTimeout;

let isDragging = false;
let seekValue = 0;

$: if (!isDragging) seekValue = $currentTime;

const HIDE_DELAY = 2000; // ms

function show() {
	showControls = true;
	resetTimer();
}

function resetTimer() {
	clearTimeout(hideTimeout);
	hideTimeout = setTimeout(() => {
		showControls = false;
	}, HIDE_DELAY);
}

function handleMouseMove() {
	show();
}

function handleMouseLeave() {
	// optional: hide immediately when leaving
	showControls = false;
}

function handleInput(e) {
	seekValue = parseFloat(e.target.value);
}

function handleRelease() {
	isDragging = false;
	seek(seekValue);
}

onDestroy(() => clearTimeout(hideTimeout));
	
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<div 
	on:wheel={handleVideoScroll}
	class="fixed z-60 overflow-visible group perspective-1000" 
	style="
		top: {target.top}px;
		left: {target.left}px;
		width: {target.width}px;
		height: {target.height}px;
		opacity: {showVideo ? 1 : 0};
		pointer-events: {showVideo ? 'auto' : 'none'};
	
	"
>
	<!-- THE CLIPPING WRAPPER -->
	<!-- We move the clip-path here so it cuts BOTH the video and the glow -->
	<!-- <div
		class="relative w-full h-full"
		on:mousemove={handleMouseMove}
		on:mouseleave={handleMouseLeave}
	> -->
	<div 
		class="relative w-full h-full overflow-visible"
		style="clip-path: inset({clipTop}px 0 {clipBottom}px 0);"
		on:mousemove={handleMouseMove}
		on:mouseleave={handleMouseLeave}
	>
		
		<!-- 5. AMBIENT GLOW (Now inside the clip-path) -->
		{#if !$isTheaterMode}
			<div class="absolute -inset-10 bg-pulse-accent/20 blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
		{/if}

		<!-- 1. THE 3D CONTENT -->
		<div class="
			relative w-full h-full transition-all duration-500 ease-out transform-gpu overflow-hidden
			{!$isTheaterMode 
				? 'rounded-2xl border border-white/20 bg-black/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:rotate-x-2' 
				: 'rounded-none border-none bg-black shadow-none'}
		">
			<!-- REFLECTION -->
			{#if !$isTheaterMode}
				<div class="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10 z-10"></div>
			{/if}

			<!-- <video 
				bind:this={el}
				class="w-full h-full {$isTheaterMode ? 'object-contain' : 'object-cover'} bg-black" 
			/> -->

			<video
				bind:this={el}
				crossorigin="anonymous"
				class="w-full h-full {fitMode}"
			/>

			<!-- CONTROL OVERLAY -->
			{#if $isTheaterMode}
				<div
					class="absolute bottom-4 left-4 right-4 transition-all duration-300"
					class:opacity-0={!showControls}
					class:opacity-100={showControls}
					class:pointer-events-none={!showControls}
					on:mousemove|stopPropagation={show}
				>
					<!-- Main panel -->
					<div class="pointer-events-auto backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl shadow-xl px-4 py-3">
						
						<!-- Timeline -->
						<input
							type="range"
							bind:value={seekValue}
							min="0"
							max={$duration}
							step="0.01"
							on:pointerdown={() => isDragging = true}
							on:pointerup={handleRelease}
							on:input={handleInput}
							class="w-full h-1 mb-3 accent-pulse-accent"
						/>

						<!-- Controls row -->
						<div class="flex items-center justify-between">
							
							<!-- LEFT: playback -->
							<div class="flex items-center gap-3">
								<button class="control-btn"
									on:click={playPrev}
								>
									<i class="fa-solid fa-backward"></i>
								</button>

								<button class="control-btn text-lg"
									on:click={togglePlayback}
								>
									<i class="fa-solid {$isPlaying ? 'fa-pause' : 'fa-play'}"></i>
								</button>

								<button class="control-btn"
									on:click={playNext}
								>
									<i class="fa-solid fa-forward"></i>
								</button>

								<span class="text-xs text-gray-300 font-mono ml-2">
									{Math.floor($currentTime)}s / {Math.floor($duration)}s
								</span>
							</div>

							<!-- RIGHT: volume + settings -->
							<div class="flex items-center gap-3">
								<button class="control-btn"
									on:click={toggleMute} 
								>
									<i class="fa-solid {$volume === 0 ? 'fa-volume-xmark text-red-400' : 'fa-volume-high'}"></i>
								</button>

								<input
									type="range"
									min="0"
									max="100"
									bind:value={$volume}
									class="w-20 h-1 accent-pulse-accent"
								/>

								<!-- <button class="control-btn">
									<i class="fa-solid fa-gear"></i>
								</button> -->

								<button class="control-btn"
									on:click|stopPropagation={toggleFitMode}
								>
									<i class="fa-solid {fitMode === 'object-contain' ? 'fa-maximize' : 'fa-minimize'}"></i>
								</button>

								<button class="control-btn"
									on:click={() => isTheaterMode.set(false)}
								>
									<i class="fa-solid fa-compress"></i>
								</button>
							</div>

						</div>
					</div>
				</div>


					<!-- <button 
						on:click|stopPropagation={toggleFitMode}
						class="flex items-center justify-center bg-black/60 hover:bg-pulse-accent hover:text-black rounded-full transition-all pointer-events-auto shadow-lg"
						use:tooltip={fitMode === 'object-contain' ? 'Cover' : 'Contain'}
					>
						<i class="fa-solid text-2xl {fitMode === 'object-contain' ? 'fa-maximize' : 'fa-minimize'}"></i>
					</button>

					<button 
						on:click={() => isTheaterMode.update(v => !v)}
						class="flex items-center justify-center bg-black/60 hover:bg-pulse-accent hover:text-black rounded-full transition-all pointer-events-auto"
						use:tooltip={'Theater off'}
					>
						<i class="fa-solid text-2xl fa-compress"></i>
					</button>
				</div> -->
			{:else}
				<div class="absolute inset-0 flex gap-1 items-end justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">

					<!-- NEW: FIT MODE TOGGLE -->
					<button 
						on:click|stopPropagation={toggleFitMode}
						class="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-pulse-accent hover:text-black rounded-full transition-all pointer-events-auto shadow-lg"
						use:tooltip={fitMode === 'object-contain' ? 'Cover' : 'Contain'}
					>
						<i class="fa-solid text-sm {fitMode === 'object-contain' ? 'fa-maximize' : 'fa-minimize'}"></i>
					</button>

					<!-- THEATER TOGGLE -->
					<button 
						on:click={() => isTheaterMode.update(v => !v)}
						class="w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-pulse-accent hover:text-black rounded-full transition-all pointer-events-auto"
						use:tooltip={$isTheaterMode ? 'Theater off' : 'Theater on'}
					>
						<i class="fa-solid text-sm {$isTheaterMode ? 'fa-compress' : 'fa-expand'}"></i>
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- HEADER EDGE GLOW (Fixed to top of clip) -->
	<!-- {#if isClippedByHeader && !$isTheaterMode}
		<div 
			class="absolute left-0 right-0 h-[2px] bg-pulse-accent shadow-[0_0_20px_rgba(34,197,94,0.6)] z-50 pointer-events-none"
			style="top: {clipTop}px;"
		></div>
	{/if} -->
</div>

<style>


@reference "../../assets/main.css";

/* Custom Perspective Utility */
.perspective-1000 {
	perspective: 1000px;
}

:global(.rotate-x-2) {
	transform: rotateX(2deg);
}

.control-btn {
	@apply flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 hover:text-pulse-accent hover:bg-white/10 transition;
}

</style>