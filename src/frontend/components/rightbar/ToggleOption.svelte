<script>


import ToggleButton from "../ui/ToggleButtonSmall.svelte";

export let title = '';
export let enabled = false;
export let onToggle = () => {};

</script>

<label class="flex items-center justify-between">
	<span class="text-sm text-gray-500 font-semibold">{title}</span>
	<ToggleButton bind:enabled={enabled} {title} {onToggle} />
</label>
