<script>

import { onMount } from 'svelte';

import { remotes, loadRemotePlayers, selectRemote, currentRemote, unread } from '../../stores/remote';

import RemoteItem from './RemoteItem.svelte';
import List from '../ui/ListFlex.svelte';
import Badge from '../ui/BadgeCircle.svelte';

onMount(() => loadRemotePlayers());

$: isHomeSelected = !$currentRemote;

</script>

<div class="group/item flex items-center gap-2 mb-2 rounded-md transition-all select-none cursor-pointer
	{isHomeSelected ? 'bg-pulse-white/10 border-pulse-accent' : 'hover:bg-pulse-white/5'}"
	class:border-l-2={isHomeSelected}
	on:click={() => selectRemote(null)}
>
	<div class="flex justify-center items-center w-12 h-12 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
		<i class="fa-solid fa-home text-violet-400 text-[20px]"></i>
	</div>
	<h2 class="flex-grow font-semibold text-pulse-white/60 group-hover/item:text-pulse-white">
		Home
	</h2>
	{#if !isHomeSelected && $unread > 0}
		<Badge count={$unread} />
	{/if}
</div>

<List 
	ItemComponent={RemoteItem}
	title="Players" 
	icon="fa-house-laptop"
	iconColor="text-blue-500"
	items={remotes}
	onSelect={selectRemote}
	selectedItem={$currentRemote}
	hideEmpty={true}
>
	
</List>
