<script>

import { volume, toggleMute } from "../../stores/play";

function handleWheel(e) {
	e.preventDefault();

	const step = Math.abs(e.deltaY) > 50 ? 5 : 1;
	const direction = e.deltaY < 0 ? 1 : -1;

	volume.update(v => {
		let next = v + direction * step;
		return Math.max(0, Math.min(100, next));
	});
}

</script>

<div 
	class="hidden @[350px]:flex flex-shrink-0 items-center gap-3 mr-4 bg-black/30 p-2 rounded-lg border border-white/5 h-9"
	on:wheel={handleWheel}
>
	<button 
		on:click={toggleMute} 
		class="flex items-center justify-center w-6 h-6 text-gray-500 hover:text-white transition-colors"
	>
		<i class="fa-solid {$volume === 0 ? 'fa-volume-xmark text-red-500' : 'fa-volume-high'} text-[11px]"></i>
	</button>
	
	<input 
		type="range" 
		min="0" 
		max="100" 
		bind:value={$volume}
		class="pulse-slider w-24"
	/>
	
	<span class="text-[9px] font-mono text-gray-600 w-6 leading-none">{$volume}%</span>
</div>