<script>

import { onMount, onDestroy } from 'svelte';

import { connectRemote, disconnectRemote } from '../../../stores/remote';

import Home from './RemoteHome.svelte';
import Library from './RemoteLibrary.svelte';

export let remote;

let activeTab = 'home';

onMount(() => connectRemote(remote));
onDestroy(() => disconnectRemote(remote));

</script>

<div class="flex h-full flex-col overflow-hidden min-w-0">

	<div class="flex items-center gap-4 rounded-xl p-4 m-4 bg-pulse-white/5">
		<i class="fa-solid fa-home text-violet-500 text-3xl"></i>
		<div class="flex-grow flex flex-col">
			<h2 class="text-pulse-white/80 font-black tracking-wider text-xl">
				{remote.name}
			</h2>
			<i class="text-sm text-gray-600">{remote.address}:{remote.port}</i>
		</div>
		
	</div>

	<div class="flex items-center px-6 mb-2">
		{#each [{id: 'home', icon: 'home'}, { id: 'library', icon: 'book-open' }] as tab}
			<button
				class="px-6 py-2 flex items-center gap-3 capitalize border-b-2 transition {activeTab === tab.id ? 'border-pulse-accent text-pulse-accent font-semibold tracking-wider' : 'border-transparent text-gray-400 hover:text-pulse-white/90'}"
				on:click={() => (activeTab = tab.id)}
			>
				<i class="fa-solid fa-{tab.icon} text-sm"></i>
				{tab.id.capitalizeFirstLetter()}
			</button>
		{/each}
	</div>

	{#if activeTab == 'home'}
		<Home />
	{:else}
		<Library />
	{/if}
</div>
