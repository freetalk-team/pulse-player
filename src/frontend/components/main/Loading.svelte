<script>

import { fade } from 'svelte/transition';

export let text = 'Loading Library';

</script>

<div in:fade={{ delay: 200 }} class="inset-0 h-full flex items-center justify-center z-10">
	<div class="flex flex-col items-center gap-4">
		<div class="w-10 h-10 border-4 border-pulse-accent/20 border-t-pulse-accent rounded-full animate-spin"></div>
		<p class="text-xs font-bold uppercase tracking-widest text-gray-500">{text}</p>
	</div>
</div>