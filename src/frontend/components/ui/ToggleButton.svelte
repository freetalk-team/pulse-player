<script>

import { tooltip } from "../../actions";

export let enabled = false;
export let onToggle = () => {};

function toggle() {
	enabled = !enabled;
	onToggle(enabled);
}

</script>

<div
	class="relative w-11 h-6 rounded-full transition-colors duration-200
		{enabled ? 'bg-pulse-accent' : 'bg-gray-600'}"
	on:click={toggle}
	use:tooltip={enabled ? 'Disable' : 'Enable'}
>
	<div
		class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
			{enabled ? 'translate-x-5' : ''}"
	/>
</div>

	
