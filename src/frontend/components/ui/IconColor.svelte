<script>

import { tooltip } from "../../actions";

export let value;
export let onSelect = () => {}

function setColor(color) {
	value = color.class;
	onSelect(color.class);
}

const colors = [
	{ name: 'Blue', class: 'text-blue-400', bg: 'bg-blue-400' },
	{ name: 'Red', class: 'text-red-400', bg: 'bg-red-400' },
	{ name: 'Accent', class: 'text-pulse-accent', bg: 'bg-pulse-accent' },
    { name: 'Indigo', class: 'text-indigo-400', bg: 'bg-indigo-400' },
    { name: 'Purple', class: 'text-purple-400', bg: 'bg-purple-400' },
    { name: 'Rose', class: 'text-rose-400', bg: 'bg-rose-400' },
    { name: 'Orange', class: 'text-orange-400', bg: 'bg-orange-400' },
    { name: 'Amber', class: 'text-amber-400', bg: 'bg-amber-400' },
    { name: 'Emerald', class: 'text-emerald-400', bg: 'bg-emerald-400' },
    { name: 'Slate', class: 'text-slate-400', bg: 'bg-slate-400' }
];

</script>

<div class="flex flex-wrap gap-2 py-1">
	{#each colors as i}
		<button
			aria-label="color"
			on:click={() => setColor(i)}
			class="w-4 h-4 rounded-full {i.bg} transition-all hover:scale-125 
			{value === i.class ? 'ring-1 ring-white/30 ring-offset-1 ring-offset-pulse-bg scale-110' : 'opacity-40 hover:opacity-100'}"
			use:tooltip={i.name}
		></button>
	{/each}
</div>