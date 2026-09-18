<script>

import { scale } from 'svelte/transition';
import { clickOutside, dropdown } from '../../../actions';

let {
	items = [],
	value = items[0]?.id,
	onChange
} = $props();

let trigger;
let isOpen = $state(false);

let selected = $derived(items.find(i => i.id == value));
let label = $derived(selected?.label ?? '');

function select(v) {
	isOpen = false;

	if (value != v.id) {
		value = v.id;
		label = v.label;

		onChange?.(v.id);
	}
}

function handleKeydown(e) {
	if (e.key === 'Escape')
		isOpen = false;
}

</script>

<div class="relative w-full" use:clickOutside={() => (isOpen = false)}>

	<div class="relative w-full">

		<input 
			bind:this={trigger}
			bind:value={label}
			onclick={() => isOpen = !isOpen}
			onkeydown={handleKeydown}
			readonly
			class="w-full select truncate pr-8 cursor-default select-none"
		/>

		<i class="fa-solid fa-caret-down text-pulse-white/30 absolute right-1 top-1/2 -translate-y-1/2 text-xs pointer-events-none"></i>
	</div>


	{#if isOpen && items.length > 0}
		<div 
			transition:scale={{ duration: 150, start: 0.95 }}
			use:dropdown={trigger}
			class="fixed z-100 flex flex-col dropdown max-h-48 custom-scroll py-1"
		>
			{#each items as item}
				<button 
					onclick={() => select(item)}
					class="w-full text-left px-3 py-2 text-[11px] hover:bg-pulse-accent/10 hover:text-pulse-accent transition-colors {value === item ? 'bg-white/5 text-pulse-accent' : 'text-gray-400'}"
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>


