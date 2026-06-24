<script>

import { tooltip } from '../../actions';
import { isPlaying, togglePlayback, queueMode, shuffleMode, repeatMode, videoMode, playNext, playPrev } from '../../stores/play';

import Volume from './Volume.svelte';
import ToggleModeButton from './ToggleModeButton.svelte';

</script>

<div class="flex flex-shrink-0 items-center justify-end gap-4 @container/inline-size w-full">

	<Volume />
	
	<div class="flex items-center gap-4 min-w-0">

		<div class="hidden @[560px]:flex flex-shrink-0 items-center gap-2">
			<ToggleModeButton title={"Queue"} icon={"fa-layer-group"} enabled={queueMode} />
			<ToggleModeButton title={"Shuffle"} icon={"fa-shuffle"} enabled={shuffleMode} />
			<ToggleModeButton title={"Repeat"} icon={"fa-repeat"} enabled={repeatMode} />
			<ToggleModeButton title={"Video"} icon={"fa-picture-in-picture"} enabled={videoMode} />
		</div>
		
		<!-- <button 
			on:click={() => queueMode = !queueMode}
			class="text-xs flex items-center gap-2 px-2 py-1 rounded-md transition-all
					{queueMode ? 'bg-pulse-accent text-black font-bold' : 'text-gray-500 hover:text-white'}"
			>
			<i class="fa-solid {queueMode ? 'fa-plus-circle' : 'fa-play-circle'}"></i>
			{queueMode ? 'Queue Mode' : 'Instant Play'}
		</button> -->

		<div class="flex flex-shrink-0 items-center gap-1">
			<button class="ctrl-btn-lg text-xl"
				aria-label="Play"
				on:click={togglePlayback}
				use:tooltip={$isPlaying ? 'Pause' : 'Play'}
			>
				<i class="fa-solid {$isPlaying ? 'fa-circle-pause' : 'fa-circle-play'}"></i>
			</button>

			<button class="ctrl-btn-lg" 
				on:click={playPrev}
				aria-label="Prev"
				use:tooltip={"Prev"}
			>
				<i class="fa-solid fa-backward-step"></i>
			</button>

			<button class="ctrl-btn-lg" 
				on:click={playNext}
				aria-label="Prev"
				use:tooltip={"Next"}
			>
				<i class="fa-solid fa-forward-step"></i>
			</button>
		</div>
	</div>
</div>

<style>

@reference "../../assets/main.css";

.ctrl-btn-lg {
	@apply text-4xl text-pulse-white hover:text-pulse-accent transition-all active:scale-95 drop-shadow-lg;
}

</style>