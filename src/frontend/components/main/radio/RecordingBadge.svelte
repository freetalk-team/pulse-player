<script>

import { onMount, onDestroy } from 'svelte';
import { fade } from 'svelte/transition';

// Prop passes down the raw 'YYYY-MM-DD HH:MM:SS' UTC string from the database row record
export let startTimeUtc = "";

let startTimestamp;
let elapsedTimeString = "00:00:00";
let intervalTimerId;

/**
 * Calculates the time difference between absolute UTC start and current UTC timeline step
 */
function updateTimer() {
	if (!startTimeUtc) return;

	// 1. Convert the custom SQL string format back into a parseable ISO standard shape
	// "2026-08-21 14:00:00" -> "2026-08-21T14:00:00Z"
	const formattedIsoString = `${startTimeUtc.replace(' ', 'T')}Z`;
	
	startTimestamp = new Date(formattedIsoString).getTime();

	updateElapsedTime();
}

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

	elapsedTimeString = `${hh}:${mm}:${ss}`;
}

onMount(() => {
	// // Run once immediately on insertion loop step
	// updateTimer();
	
	// // Pulse interval loop exactly every 1 second to increment display strings live
	// intervalTimerId = setInterval(updateTimer, 1000);

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
	<span class="uppercase font-sans font-black mr-0.5 text-[9px]">REC</span>
	<span>{elapsedTimeString}</span>
</div>
