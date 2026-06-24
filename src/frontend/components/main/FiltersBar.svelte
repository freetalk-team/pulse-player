<script>

import { writable } from 'svelte/store';

export let activeFilter = 'rating'; // default

const options = [
	{ id: 'rating', label: 'Top Rated', icon: 'fa-star' },
	{ id: 'recent', label: 'Recently Played', icon: 'fa-clock-rotate-left' },
	{ id: 'created', label: 'Newest', icon: 'fa-calendar-plus' }
];

</script>

<div class="flex items-center bg-black/40 p-1 rounded-xl border border-white/5 h-9">
	{#each options as opt}
		<button 
			on:click={() => activeFilter = opt.id}
			class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
			{activeFilter === opt.id ? 'bg-pulse-accent text-black shadow-lg shadow-pulse-accent/20' : 'text-gray-500 hover:text-gray-300'}"
		>
			<i class="fa-solid {opt.icon} text-[9px]"></i>
			<span class="hidden lg:block">{opt.label}</span>
		</button>
	{/each}
</div>
