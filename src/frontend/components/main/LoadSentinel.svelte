<script>

import { onMount } from 'svelte';

export let isLoading = false;
export let hasMore = true;
export let fetch;

let sentinel;
let isIntersecting = false;
let observer;

function loadMore() {
	if (isIntersecting && !isLoading && hasMore) {
		fetch();
	}
}

onMount(() => {
	observer = new IntersectionObserver(
		([entry]) => {
			isIntersecting = entry.isIntersecting;
		},
		{ rootMargin: '300px' }
	);

	if (sentinel) {
		observer.observe(sentinel);
	}

	return () => observer.disconnect();
});

$: if (isIntersecting && !isLoading && hasMore) {
	loadMore();
}

</script>

<div
	bind:this={sentinel}
	class="w-full py-10 flex flex-col items-center justify-center"
>
	{#if isLoading && hasMore}
		<div class="flex flex-col items-center gap-3">
			<div class="w-8 h-8 border-2 border-pulse-accent border-t-transparent rounded-full animate-spin"></div>

			<span class="text-[10px] text-gray-500 uppercase tracking-widest font-bold animate-pulse">
				Syncing Pulse...
			</span>
		</div>
	{:else if !hasMore}
		<div class="text-gray-700 text-xs italic">
			End of Library
		</div>
	{/if}
</div>
