<script>

import logo from '@resources/icon.png?asset';

import { currentLayout } from '../stores/ui';

import Item from './navbar/Item.svelte';
	import { isElectron } from '../utils/env'

function handleChange(name) {
	currentLayout.set(name);
}

</script>

<nav class="w-[60px] h-full bg-pulse-nav/[0.5] shadow-nav flex flex-col flex-shrink-0 items-center py-6 gap-8">
	
	<!-- Logo with constant glow -->
	<!-- <div class="text-pulse-accent text-2xl mb-4 drop-shadow-[0_0_8px_rgba(29,185,84,0.5)]">
		<i class="fa-solid fa-bolt-lightning"></i>
	</div> -->

	<img src={logo} alt="logo" class="w-10 h-10" />

	<Item name={'home'} active={$currentLayout === 'home'} icon={'fa-house'} onClick={handleChange} />
	<Item name={'player'} active={$currentLayout === 'player'} icon={'fa-play'} onClick={handleChange} />

	{#if isElectron}
		<Item name={'remote'} active={$currentLayout === 'remote'} icon={'fa-share-nodes'} onClick={handleChange} />
	{/if}

	<Item name={'radio'} active={$currentLayout === 'radio'} icon={'fa-radio'} onClick={handleChange} />

	<div class="flex-grow"></div>

	<Item name={'settings'} active={$currentLayout === 'settings'} icon={'fa-gear'} onClick={handleChange} />
</nav>

<!-- src/renderer/src/components/Navbar.svelte -->

