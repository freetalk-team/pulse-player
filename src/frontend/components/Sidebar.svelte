<script>

import { onMount } from 'svelte';
import { fly } from 'svelte/transition';

import { scrollHover} from '../actions.js';

import { currentLayout } from '../stores/ui.js';

import Header from './sidebar/Header.svelte';
import PlayerView from './sidebar/PlayerView.svelte';
import RemoteView from './sidebar/RemoteView.svelte';
import SettingsView from './sidebar/SettingsView.svelte';

export let width;

let isResizing = false;


function onMouseMove(e) {
	if (!isResizing) return;

	// 60 is the Navbar width. Clamp between 160 and 600.
	width = Math.min(Math.max(260, e.clientX - 60), 600);
}

function stopResizing() {
	if (!isResizing) return;

	isResizing = false;

	// Save the new widths
	if (window.isElectron) {
		window.api.setPref('sidebarWidth', width);
	} else {
		localStorage.setItem('sidebarWidth', width);
	}
}

</script>

<svelte:window 
	on:mousemove={onMouseMove} 
	on:mouseup={stopResizing}
/>

<aside 
	class="bg-pulse-bg relative flex flex-col flex-shrink-0 group overflow-hidden {!isResizing ? 'transition-all duration-500 ease-in-out' : ''}"
	style="width: {width}px">

	{#key $currentLayout}

	<Header />

	<!-- <Scanner bind:droppedPaths /> -->

	<div use:scrollHover class="custom-scroll overflow-y-auto p-2 flex-grow">

		{#if $currentLayout == 'player'}
			<PlayerView />
		{:else if $currentLayout == 'remote'}
			<RemoteView />
		{:else if $currentLayout == 'settings'}
			<SettingsView />
		{/if}
		
	</div>

	{/key}

	<!-- Resizer Handle -->
	<div 
		on:mousedown={() => isResizing = true } 
		class="resizer-container -right-[6px] {isResizing ? 'resizing-active' : ''}"
	>
		<div class="v-sash"></div>
	</div>
</aside>

