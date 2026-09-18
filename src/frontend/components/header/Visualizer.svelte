<script>

import { onMount, onDestroy } from 'svelte';

import { isPlaying, analyserEnabled, getAnalyserData } from '../../stores/play';
import { isHidden } from '../../stores/ui';

export let width = 120;
export let height = 24;

let canvas;
let ctx;
let frame = null;

onMount(() => {
	ctx = canvas.getContext('2d');

	if ($isPlaying && $analyserEnabled) {
		startRender();
	}
});

onDestroy(() => {
	stopRender();
});

function startRender() {
	if (frame) return;
	frame = requestAnimationFrame(render);
}

function stopRender() {
	if (frame) {
		cancelAnimationFrame(frame);
		frame = null;
	}
}

function clear() {
	ctx?.clearRect(0, 0, width, height);
}

function render() {
	frame = null;

	if (!$isPlaying || !$analyserEnabled || $isHidden) {
		clear();
		return;
	}

	const dataArray = getAnalyserData();

	if (!dataArray) {
		clear();
		return;
	}

	draw(dataArray);

	frame = requestAnimationFrame(render);
}

function draw(dataArray) {
	ctx.clearRect(0, 0, width, height);

	const gradient = ctx.createLinearGradient(0, 0, 0, height);
	gradient.addColorStop(0, 'transparent');
	gradient.addColorStop(0.5, '#22c55e');
	gradient.addColorStop(1, 'transparent');

	const barCount = Math.floor(dataArray.length / 2);
	const barWidth = width / barCount;

	let x = 0;

	ctx.fillStyle = gradient;

	for (let i = 0; i < barCount; i++) {
		const v = dataArray[i] / 255;
		const barHeight = v * height;
		const y = (height - barHeight) / 2;

		if (barHeight < 2) {
			ctx.fillRect(
				x,
				height / 2 - 1,
				barWidth - 1.5,
				2
			);
		} else {
			ctx.beginPath();
			ctx.roundRect(
				x,
				y,
				barWidth - 1.5,
				barHeight,
				1
			);
			ctx.fill();
		}

		x += barWidth;
	}
}

$: {
	if (!$isPlaying || !$analyserEnabled || $isHidden) {
		stopRender();
		clear();
	} else if (ctx && !frame) {
		startRender();
	}
}

</script>

<canvas
	bind:this={canvas}
	{width}
	{height}
	class="opacity-80 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
/>