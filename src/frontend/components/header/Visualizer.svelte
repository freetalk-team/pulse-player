<script>

import { onDestroy } from 'svelte';
import { videoElement, isPlaying } from '../../stores/play';
import { isHidden } from '../../stores/ui';

export let width = 120;
export let height = 24;

let canvas, ctx, analyser, dataArray, audioCtx, frame;

async function init() {
	if (!$videoElement || !canvas || analyser || audioCtx) return;

	const AudioContext = window.AudioContext || window.webkitAudioContext;
	audioCtx = new AudioContext();
	analyser = audioCtx.createAnalyser();
	analyser.fftSize = 128; 
	analyser.smoothingTimeConstant = 0.8; 

	const source = audioCtx.createMediaElementSource($videoElement);
	source.connect(analyser);
	analyser.connect(audioCtx.destination);

	dataArray = new Uint8Array(analyser.frequencyBinCount);
	ctx = canvas.getContext('2d');
	
	// If already playing when initialized, start rendering
	if ($isPlaying) render();
}

function render() {
	// 1. Safety check
	if (!ctx || !analyser) return;

	// 2. Handle AudioContext state
	if (audioCtx?.state === 'suspended' && $isPlaying) audioCtx.resume();

	// 3. STOP the loop if not playing
	if (!$isPlaying || $isHidden) {
		ctx.clearRect(0, 0, width, height);
		cancelAnimationFrame(frame);
		frame = null; // Clear the handle
		return; 
	}

	// 4. Single requestAnimationFrame call
	frame = requestAnimationFrame(render);
	
	analyser.getByteFrequencyData(dataArray);
	ctx.clearRect(0, 0, width, height);

	const gradient = ctx.createLinearGradient(0, 0, 0, height);
	gradient.addColorStop(0, 'transparent');
	gradient.addColorStop(0.5, '#22c55e'); 
	gradient.addColorStop(1, 'transparent');

	const barCount = dataArray.length / 2;
	const barWidth = width / barCount;
	let x = 0;

	for (let i = 0; i < barCount; i++) {
		const v = dataArray[i] / 255.0;
		const barHeight = v * height;
		const y = (height - barHeight) / 2;

		ctx.fillStyle = gradient;
		if (barHeight < 2) {
			ctx.fillRect(x, (height/2) - 1, barWidth - 1.5, 2);
		} else {
			ctx.beginPath();
			ctx.roundRect(x, y, barWidth - 1.5, barHeight, 1);
			ctx.fill();
		}
		x += barWidth;
	}
}

// 5. Reactive triggers
$: if (canvas && $videoElement && !analyser) init();

// Restart the loop only if it's not already running
$: if ($isPlaying && analyser && !frame) render();

onDestroy(() => {
	if (frame) cancelAnimationFrame(frame);
	if (audioCtx) audioCtx.close();
});

</script>

<canvas 
	bind:this={canvas} 
	{width} {height} 
	class="opacity-80 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
></canvas>

