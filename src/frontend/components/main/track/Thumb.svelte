<script>

import { onDestroy } from 'svelte';

let { track } = $props();

let src = $state(null);

async function load() {
    if (!track.thumb_path) {
        src = null;
        return;
    }

    src = await platform.resolveThumb(track.thumb_path);
}

$effect(() => {
    load();
});

onDestroy(() => {
    if (src?.startsWith('blob:')) {
        URL.revokeObjectURL(src);
    }
});

</script>

{#if src}
	<img
		draggable="false"
		src={src}
		class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
		alt=""
	/>
{:else}
	<div class="w-full h-full flex items-center justify-center text-gray-800">
		<i class="fa-solid {track.type === 'video' ? 'fa-video' : 'fa-music'} text-4xl"></i>
	</div>
{/if}