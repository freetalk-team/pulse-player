<script>

export let track;
export let active = false; // Only play if hovered or currently selected

let videoElement;

$: if (videoElement) {
	if (active) videoElement.play().catch(() => {});
	else videoElement.pause();
}

</script>

<div class="w-full h-full bg-black overflow-hidden">
	<video
		bind:this={videoElement}
		src="{platform.resolve(track.path)}"
		class="w-full h-full object-cover"
		muted
		loop
		playsinline
	/>
</div>
