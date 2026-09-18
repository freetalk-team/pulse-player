<script>

import { onMount } from "svelte";

let pro = false;

onMount(() => {
	const features = api.getPref('features');
	pro = features.length == 3;
});
	
</script>

<div class="flex items-center gap-4 w-full">
	<div class="w-6 text-center text-lg">
		<i class="fa-solid fa-crown"></i>
	</div>
	<span class="text-sm font-semibold flex-grow">Features</span>
	{#if pro}
		<span class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
			Pro
		</span>
	{:else}
		<span class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border shrink-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
			<i class="fa-solid fa-lock"></i>
		</span>
	{/if}
</div>