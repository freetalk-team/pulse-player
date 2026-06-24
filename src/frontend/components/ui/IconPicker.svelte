<script>

import { fade, scale } from 'svelte/transition';

import { clickOutside } from '../../actions';

export let value = 'fa-music';
export let color = 'text-pulse-accent';
export let onSelect;
export let placement = 'bottom'; // 'bottom' or 'top'

let isOpen = false;

const icons = [
	'fa-music', 'fa-headphones', 'fa-record-vinyl', 'fa-compact-disc',
	'fa-heart', 'fa-star', 'fa-fire', 'fa-bolt',
	'fa-moon', 'fa-sun', 'fa-cloud', 'fa-snowflake', 
	'fa-dumbbell', 'fa-running', 'fa-bicycle', 'fa-gamepad',
	'fa-guitar', 'fa-drum', 'fa-microphone', 'fa-radio',
	'fa-coffee', 'fa-cocktail', 'fa-pizza-slice', 'fa-leaf',
];

function handleSelect(icon) {
	value = icon;
	isOpen = false;
	if (onSelect) 
		onSelect(icon);
}

</script>

<div class="relative w-full" use:clickOutside={() => (isOpen = false)}>
	<button 
		type="button"
		on:click|stopPropagation={() => (isOpen = !isOpen)}
		class="w-full flex items-center justify-between bg-white/5 p-2 rounded hover:bg-white/10 transition-colors border border-transparent {isOpen ? 'border-pulse-accent/30' : ''}"
	>
		<i class="fa-solid {value} {color}"></i>
		<i class="fa-solid fa-chevron-down text-[8px] text-gray-600 transition-transform {isOpen ? 'rotate-180' : ''}"></i>
	</button>

	{#if isOpen}
		<div 
			transition:scale={{ duration: 150, start: 0.95 }}
			class="absolute left-0 z-[100] bg-gray-900 border border-white/10 rounded-lg p-2 shadow-2xl grid grid-cols-4 gap-1 w-40 {placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}"
		>
			{#each icons as icon}
				<button 
					on:click={() => handleSelect(icon)}
					class="p-2 hover:bg-white/10 rounded transition-all {value === icon ? color : 'text-gray-500'}"
				>
					<i class="fa-solid {icon} text-sm"></i>
				</button>
			{/each}
		</div>
	{/if}
</div>
