<script>


import ToggleButton from "../../ui/ToggleButton.svelte";

export let title = '';
export let enabled = false;
export let description = null;
export let warn = null;
export let onToggle = () => {};

</script>

<div class="flex flex-col gap-1">

	<label class="flex items-center justify-between cursor-pointer">
		<span class="text-sm text-gray-300 font-semibold">{title}</span>
		<ToggleButton {enabled} {title} {onToggle} />
	</label>

	{#if description}
		<p class="italic text-sm text-gray-600">
			{description}
		</p>
	{/if}

	{#if warn}
		<span class="text-xs text-yellow-400">
  			<span class="mr-2">⚠️</span> 
			{warn}
		</span>
	{/if}

</div>