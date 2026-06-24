<script>

import { tooltip } from "../../actions";

export let order;
export let onChange = () => {};

// You can move this to a store later to sync with HomeView

const options = [
	{ id: 'rating', icon: 'fa-star', label: 'Top Rated' },
	{ id: 'recent', icon: 'fa-clock-rotate-left', label: 'Recently Played' },
	{ id: 'created', icon: 'fa-calendar-plus', label: 'Recently Added' }
];

function setSortOrder(id) {
	if (id !== order) {
		order = id;
		onChange(id);
	}
}

</script>

<div class="flex items-center bg-black/20 p-1 rounded-xl border border-white/5 h-10 shadow-inner">
	{#each options as opt}
		<button 
			on:click={() => setSortOrder(opt.id)}
			class="w-9 h-8 flex items-center justify-center rounded-lg transition-all relative group
			{order === opt.id ? 'text-pulse-accent bg-white/5' : 'text-gray-500 hover:text-gray-300'}"
			use:tooltip={opt.label}
		>
			<i class="fa-solid {opt.icon} text-xs"></i>
			
			{#if order === opt.id}
				<!-- Subtle "Active" Indicator Dot -->
				<div class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-pulse-accent rounded-full shadow-[0_0_8px_#22c55e]"></div>
			{/if}
		</button>
	{/each}
</div>
