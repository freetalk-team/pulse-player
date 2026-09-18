<script>

import DurationBadge from "../ui/DurationBadge.svelte";

export let duration = 0;
export let count = 0;

</script>

<div class="flex items-center gap-2">
	{#if duration > 0}
		<DurationBadge duration={duration} />
	{/if}
	{#if count > 0}
		<span class="text-[10px] min-w-4 font-mono text-gray-500 text-right">
			{count}
		</span>
	{/if}
</div>