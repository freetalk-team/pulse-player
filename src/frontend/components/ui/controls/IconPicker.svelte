<script>

import { fade, scale } from 'svelte/transition';

import { clickOutside, dropdown } from '../../../actions';
import { Icons, Colors } from '../icons';

export let value = 'fa-music';
export let color = 'accent';
export let onSelect;

let pickerElement;
let isOpen = false;

function handleSelect(icon) {
	value = icon;
	isOpen = false;
	if (onSelect) 
		onSelect(icon);
}

</script>

<div class="relative w-full max-w-[250px]"
	bind:this={pickerElement}
	use:clickOutside={() => (isOpen = false)}
>
	<button 
		type="button"
		on:click|stopPropagation={() => (isOpen = !isOpen)}
		class="w-full flex items-center justify-between bg-white/5 p-2 rounded hover:bg-white/10 transition-colors border border-transparent {isOpen ? 'border-pulse-accent/30' : ''}"
	>
		<i class="fa-solid {value}" style:color={Colors[color]}></i>
		<i class="fa-solid fa-chevron-down text-[8px] text-gray-600 transition-transform {isOpen ? 'rotate-180' : ''}"></i>
	</button>

	{#if isOpen}
		<div class="fixed z-[100] dropdown p-1"
			use:dropdown={pickerElement}
			transition:scale={{ duration: 150, start: 0.95 }}
		>
			{#each Icons as icon}
				<button 
					on:click={() => handleSelect(icon)}
					class="p-2 hover:bg-pulse-white/10 rounded transition-all"
					style:color={value === icon ? Colors[color] : ''}
				>
					<i class="fa-solid {icon} text-sm"></i>
				</button>
			{/each}
		</div>
	{/if}
</div>
