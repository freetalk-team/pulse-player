<script>

import { onMount, onDestroy } from 'svelte';
import { fade } from 'svelte/transition';

let startTimestamp;
let elapsedTimeString = "00:00";
let intervalTimerId;

function updateElapsedTime() {
	// 2. Compute absolute difference in milliseconds against current local system runtime clock anchor
	const nowMs = Date.now();
	const differenceMs = nowMs - startTimestamp;

	// 3. Fallback handle in case of minor network clock sync delays
	if (differenceMs <= 0) {
		elapsedTimeString = "00:00:00";
		return;
	}

	// 4. Mathematical component breakdown conversion parameters
	const totalSeconds = Math.floor(differenceMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	// 5. Apply string padding format framework mapping configurations
	const hh = hours.toString().padStart(2, '0');
	const mm = minutes.toString().padStart(2, '0');
	const ss = seconds.toString().padStart(2, '0');

	elapsedTimeString = hours > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

onMount(() => {

	startTimestamp = Date.now();

	updateElapsedTime();

	intervalTimerId = setInterval(updateElapsedTime, 1000);
});

onDestroy(() => {
	// Reclaim memory allocations and eliminate timer leaks when item unmounts or completes
	if (intervalTimerId) clearInterval(intervalTimerId);
});

</script>

<!-- Live Pulsating Recording Tag Layout -->
<div 
	transition:fade={{ duration: 150 }} 
	class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold tracking-wider select-none shadow-sm shadow-red-500/5"
>
	<!-- Glowing core indicator map animation icon -->
	<span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]"></span>
	<span>{elapsedTimeString}</span>
</div>
