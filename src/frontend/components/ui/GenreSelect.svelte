<script>

import { scale } from 'svelte/transition';
import { clickOutside } from '../../actions';
import { allAvailableGenres } from '../../stores/library';

export let value = "";
export let onChange;
export let placement = 'bottom';

let isOpen = false;

$: filtered = $allAvailableGenres.filter(g => 
	g.toLowerCase().includes(value?.toLowerCase())
);

function select(genre) {
	value = genre;
	isOpen = false;
	if (onChange) onChange(value);
}

</script>

<div class="relative w-full" use:clickOutside={() => (isOpen = false)}>
	<input 
		bind:value
		on:focus={() => (isOpen = true)}
		on:input={() => (isOpen = true)}
		placeholder="Search or type..."
		class="w-full bg-white/5 text-xs p-2 rounded outline-none border border-transparent focus:border-pulse-accent/30 transition-all placeholder:text-gray-600"
	/>

	{#if isOpen && filtered.length > 0}
		<div 
			transition:scale={{ duration: 150, start: 0.95 }}
			class="absolute left-0 right-0 z-100 bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-h-48 overflow-y-auto custom-scroll py-1 {placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}"
		>
			{#each filtered as genre}
				<button 
					on:click={() => select(genre)}
					class="w-full text-left px-3 py-2 text-[11px] hover:bg-pulse-accent/10 hover:text-pulse-accent transition-colors {value === genre ? 'bg-white/5 text-pulse-accent' : 'text-gray-400'}"
				>
					{genre}
				</button>
			{/each}
		</div>
	{/if}
</div>
