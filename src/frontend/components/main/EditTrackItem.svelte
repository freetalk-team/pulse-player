<script>

import { formatDuration } from '../../utils/format';
import { tooltip } from '../../actions';

export let track;
export let index;

function handleRemoveTrack() {

}

</script>


<div class="flex flex-grow items-center gap-4 p-2 hover:bg-white/5 rounded-lg group w-full">
	<span class="flex-shrink-0 text-xs font-mono text-gray-600 w-4">{index}</span>
	<!-- 1. IMAGE / ICON CONTAINER (Fixed Width/Height) -->
	<div class="w-10 h-10 flex-shrink-0 rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center">
		{#if track.thumb_path || track.cover_path}
			<img 
				src="media://{track.thumb_path || track.cover_path}" 
				class="w-full h-full object-cover" 
				alt="" 
			/>
		{:else}
			<!-- Use a wrapper for the icon to match the img's visual weight -->
			<div class="flex items-center justify-center w-full h-full bg-gradient-to-br from-white/5 to-transparent">
				<i class="fa-solid {track.type === 'video' ? 'fa-film text-purple-500/40' : 'fa-music text-pulse-accent/40'} text-sm"></i>
			</div>
		{/if}
	</div>
	
	<div class="flex-grow min-w-0 flex flex-col justify-center">
		<p class="text-sm font-bold truncate">{track.title}</p>
		<p class="text-[10px] text-gray-500 truncate">{track.artist}</p>
	</div>

	<!-- ACTIONS -->
	<div class="flex items-center gap-2">
		<span class="text-[10px] font-mono text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
			{formatDuration(track.duration)}
		</span>
		<button 
			on:click={() => handleRemoveTrack(track.id)}
			class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all p-2"
			use:tooltip={"Remove from playlist"}
		>
			<i class="fa-solid fa-xmark text-xs"></i>
		</button>
	</div>
	
</div>