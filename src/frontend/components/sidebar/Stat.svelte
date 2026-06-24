<script>

import DurationBadge from "../ui/DurationBadge.svelte";

export let item;

</script>

<div class="flex items-center gap-2">
	{#if item.total_duration > 0}
		<DurationBadge duration={item.total_duration} />
	{/if}
	<span class="text-[10px] min-w-4 font-mono text-gray-500 text-right">
		{item.track_count}
	</span>
</div>