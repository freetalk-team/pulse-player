<script>

import { tooltip } from '../../actions';
import { isPlaying, togglePlayback, playNext, playPrev, stop, currentRadio, currentTrack } from '../../stores/play';

import Volume from './Volume.svelte';

$: isPlayerMode = !$currentRadio;
$: canStop = $currentTrack || $currentRadio;

</script>

<div class="flex flex-shrink-0 items-center justify-end gap-4">
	<div class="flex items-center gap-4 min-w-0">
		<div class="flex flex-shrink-0 items-center gap-1">
			<button aria-label="Play"
				class="ctrl-btn {$isPlaying ? 'danger' : 'normal'}"
				on:click={togglePlayback}
				use:tooltip={$isPlaying ? 'Pause' : 'Play'}
			>
				<i class="fa-solid {$isPlaying ? 'fa-circle-pause' : 'fa-circle-play'}"></i>
			</button>

			{#if canStop}
				<button aria-label="Stop"
					class="ctrl-btn danger"
					on:click={stop}
					use:tooltip={'Stop'}
				>
					<i class="fa-solid fa-circle-stop"></i>
				</button>
			{/if}

			
		</div>
	</div>
</div>

<style>

@reference "../../assets/main.css";

.ctrl-btn {
	@apply text-4xl text-pulse-white transition-all active:scale-95 drop-shadow-lg;
}

.ctrl-btn.normal {
	@apply hover:text-pulse-accent;
}

.ctrl-btn.danger {
	@apply hover:text-red-400;
}

</style>