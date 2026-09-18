<script>

import { tooltip } from "../../../actions";
import { Colors } from "../icons";

export let value;
export let onSelect;

function setColor(color) {
	value = color;
	onSelect?.(color);
}

const colors = Object.keys(Colors);

</script>

<div class="flex flex-wrap gap-2 py-1">
	{#each colors as i}
		<button
			aria-label="color"
			on:click={() => setColor(i)}
			class="w-4 h-4 rounded-full transition-all hover:scale-125 
			{value === i ? 'ring-1 ring-white/30 ring-offset-1 ring-offset-pulse-bg scale-110' : 'opacity-40 hover:opacity-100'}"
			style:background-color={Colors[i]}
			use:tooltip={i.capitalizeFirstLetter()}
		></button>
	{/each}
</div>