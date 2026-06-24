<script>
import { currentTime, duration, seek } from '../../stores/play';

let isDragging = false;
let seekValue = 0;

$: if (!isDragging) seekValue = $currentTime;

const formatTime = (s) =>
	`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;

function handleInput(e) {
	seekValue = parseFloat(e.target.value);
}

function handleRelease() {
	isDragging = false;
	seek(seekValue);
}
</script>

<div class="flex flex-grow items-center gap-4 max-w-[600px] -webkit-app-region: no-drag">

	<input
		type="range"
		bind:value={seekValue}
		min="0"
		max={$duration}
		step="0.01"
		on:pointerdown={() => isDragging = true}
		on:pointerup={handleRelease}
		on:input={handleInput}
		class="pulse-slider flex-grow"
	/>

	<span class="text-[10px] font-mono text-gray-500 w-10">
		{formatTime(seekValue)}
	</span>

</div>
