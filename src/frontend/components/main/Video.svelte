<script>

import { slide } from "svelte/transition";

import { isVideoView, videoMode } from '../../stores/play';
import { isTheaterMode } from '../../stores/selection';

import VideoPortal from '../ui/VideoPortal.svelte';

</script>

{#if $isVideoView && $videoMode && !$isTheaterMode}
	<div transition:slide class="p-4">
		<div class="max-w-4xl mx-auto aspect-video">
			<VideoPortal />
		</div>
	</div>
{/if}