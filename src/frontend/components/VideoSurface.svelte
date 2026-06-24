<script>
	import { currentTime, duration, isPlaying, volume, currentTrack } from '../stores/play';
	import { isTheaterMode } from '../stores/ui';

	export let controls = false;
	export let isPreview = false;
	export let track = null;

	let videoElement;

	// Determine WHICH track this instance should be playing
	// If it's a preview, use the passed track. Otherwise, use global.
	$: activeTrack = isPreview ? track : $currentTrack;

	// 1. Sync Volume (Master only)
	$: if (videoElement && !isPreview) {
		videoElement.volume = $volume / 100;
	}

	// 2. Play/Pause Logic (Master)
	async function syncPlayback() {
		if (!videoElement || isPreview) return;
		try {
			if ($isPlaying) await videoElement.play();
			else videoElement.pause();
		} catch (err) {}
	}

	// 3. Play/Pause Logic (Preview Card)
	$: if (videoElement && isPreview) {
		// Only play if hovered OR (it's the current track AND theater is off)
		// We use a simplified logic here to let the Card component control it
		videoElement.play().catch(() => {});
	}

	$: $isPlaying, !isPreview && syncPlayback();
</script>

<div class="w-full h-full bg-black overflow-hidden flex items-center justify-center">
	{#key activeTrack?.path}
		<video
			bind:this={videoElement}
			src="media://{activeTrack?.path}"
			class="w-full h-full {isPreview ? 'object-cover' : 'object-contain'}"
			on:loadedmetadata={!isPreview ? syncPlayback : null} 
			on:click={!isPreview ? () => isPlaying.update(p => !p) : null}
			muted={isPreview}
			loop={isPreview}
			playsinline
		/>
	{/key}
</div>
