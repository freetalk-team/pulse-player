<script>

import { fade } from 'svelte/transition';

import { currentLayout, isLoading } from '../stores/ui';

import Loading from './main/Loading.svelte';
import PlayerView from './main/PlayerView.svelte';
import HomeView from './main/HomeView.svelte';
import SettingsView from './main/SettingsView.svelte';
import RemoteView from './main/RemoteView.svelte';
import ShareModal from './main/ShareModal.svelte';

</script>

<ShareModal />

<main class="bg-pulse-main/50 flex-shrink-1 min-w-0 w-full">

<!-- {#if $isLoading}
	<Loading />
{:else} -->
	
	{#key $currentLayout}
		<div class="overflow-hidden h-full"
			in:fade={{ duration: 200 }}
		>
			{#if $currentLayout === 'home'}
				<HomeView /> 
			{:else if $currentLayout === 'player'}
				<PlayerView />
			{:else if $currentLayout === 'remote'}
				<RemoteView />
			{:else if $currentLayout === 'settings'}
				<SettingsView />
			{/if}
		</div>
	{/key}
<!-- {/if} -->

</main>
