<script>

import { currentTime, duration, isPlaying, volume, currentTrack } from '../../stores/play';
import { isTheaterMode } from '../../stores/ui';

let videoElement;
let isUserSeeking = false;

// External Seek Support
$: if (videoElement && !isUserSeeking) {
	if (Math.abs(videoElement.currentTime - $currentTime) > 1.5) {
		// console.log('Setting current time:', $currentTime);
		videoElement.currentTime = $currentTime;
	}
}

// Handle Global Play/Pause
async function syncPlayback() {
	if (!videoElement) return;
	try {

		console.log('Set is playing', $isPlaying);

		if ($isPlaying) 
			await videoElement.play();
		else 
			videoElement.pause();
	} catch (e) {

	}
}

// Update Global Seeker
function handleTimeUpdate() {
	// console.log('Updating current time:', videoElement.currentTime);

	if (videoElement && !isUserSeeking && $isPlaying) {
		currentTime.set(videoElement.currentTime);
	}
}


function handleMetadata() {
	console.log('On metadata:');

	if (videoElement) {
		duration.set(videoElement.duration);

		if ($currentTime > 0)
			videoElement.currentTime = $currentTime;

		videoElement.volume = $volume / 100;
		syncPlayback();
	}

}

$: $isPlaying, syncPlayback();

function onSeeking() {
	console.log('On seeking');
	isUserSeeking = true;
}

function onSeekingEnd() {
	console.log('On seeking end');
	isUserSeeking = false;
}

</script>

<!-- Inside VideoPlayer.svelte -->
<div class="relative group w-full h-full">
    {#key $currentTrack?.path}
		<video
			bind:this={videoElement}
			src="media://{$currentTrack?.path}"
			class="w-full h-full object-contain"
			on:loadedmetadata={handleMetadata}
			on:timeupdate={handleTimeUpdate}
			on:click={() => isPlaying.update(p => !p)}
			on:ended={() => isPlaying.set(false)}
			on:seeking={onSeeking} 
            on:seeked={onSeekingEnd}
		>
			<track kind="captions" />
		</video>
	{/key}

    <!-- Overlay Controls -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
        <div class="flex justify-between w-full items-center">
            <!-- Left: Play/Pause/Time -->
            <div class="flex items-center gap-4"> ... </div>

            <!-- Right: Theater Toggle -->
            <button 
                on:click={() => isTheaterMode.update(v => !v)}
                class="text-white hover:text-pulse-accent p-2 transition-colors"
                title={$isTheaterMode ? "Exit Theater Mode" : "Theater Mode"}
            >
                <i class="fa-solid {$isTheaterMode ? 'fa-compress' : 'fa-expand'}"></i>
            </button>
        </div>
    </div>
</div>

