<script>

import { activeTab } from '../../stores/home';
import { fly } from 'svelte/transition';

const tabs = [
	{ id: 'all', label: 'All', icon: 'fa-border-all' },
	{ id: 'playset', label: 'Playsets', icon: 'fa-clock' },
	{ id: 'playlist', label: 'Playlists', icon: 'fa-list-ul' },
	{ id: 'album', label: 'Albums', icon: 'fa-record-vinyl' }
];

function selectTab(id) {
	activeTab.set(id);
}

</script>

<div class="flex items-center bg-black/40 p-1 rounded-2xl border border-white/5 w-fit shadow-inner relative">
	{#each tabs as tab}
		<button 
			on:click={() => selectTab(tab.id)}
			class="relative z-10 flex items-center gap-2 px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300
			{$activeTab === tab.id ? 'text-black' : 'text-gray-500 hover:text-gray-300'}"
		>
			<i class="fa-solid {tab.icon} text-[10px]"></i>
			<span>{tab.label}</span>

			{#if $activeTab === tab.id}
				<!-- THE SLIDING PILL -->
				<div 
					layoutId="active-tab"
					class="absolute inset-0 bg-pulse-accent rounded-xl -z-10 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
					in:fly={{ y: 2, duration: 200 }}
				></div>
			{/if}
		</button>
	{/each}
</div>
