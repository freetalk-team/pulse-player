<script>

import { onMount } from 'svelte';
import { derived } from 'svelte/store';

import { tooltip } from '../../actions';

import { currentSettings } from '../../stores/settings';
import { albumComponents, trackComponents, loadComponents, loadComponent, selectedComponent, newComponent, deleteComponent } from '../../stores/components';

import ListFlex from '../ui/ListFlex.svelte';
import ComponentItem from './ComponentItem.svelte';
import FeaturesItem from './FeaturesItem.svelte';

const settings = [
	{
		id: 'general',
		title: 'General',
		icon: 'fa-gears',
	},
	{
		id: 'ui',
		title: 'Interface',
		icon: 'fa-palette',
	},
	{
		id: 'features',
		component: FeaturesItem
	},
	{
		id: 'about',
		title: 'About',
		icon: 'fa-circle-info',
	},
	
];

onMount(async () => {
	await loadComponents();
})


function onSelect(item) {
	currentSettings.set(item.id);
	selectedComponent.set(null);
}

function onSelectComponent(item) {
	currentSettings.set('component');
	loadComponent(item);
}

</script>

{#each settings as item}
	<div 
		role="button" tabindex="0"
		on:click={() => onSelect(item)}
		on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item)}
		class="group flex items-center gap-3 p-2 rounded-md transition-all cursor-pointer
			{$currentSettings === item.id 
				? 'bg-pulse-white/10 text-pulse-white' 
				: 'text-gray-400 hover:bg-pulse-white/5 hover:text-gray-200'
			}"
	>
		{#if item.component}
			<svelte:component this={item.component} />
		{:else}
			<div class="flex items-center gap-4">
				<div class="w-6 text-center text-lg">
					<i class="fa-solid {item.icon} {item.iconColor || ''}"></i>
				</div>
				<span class="text-sm font-semibold">{item.title}</span>
			</div>
		{/if}
	</div>

{/each}

{#if __PLATFORM__ === 'desktop'}

<div class="flex flex-col mt-4 gap-2">
	<h4 class="text-gray-500 truncate uppercase font-semibold tracking-wider px-2">
		<i class="fa-solid fa-code"></i>
		Components
	</h4>

	<!-- {#each $components as item}
		<ComponentItem {item} isSelected={item.id == selectedComponent?.id} onSelect={onSelectComponent} />
	{/each} -->

	<ListFlex
		ItemComponent={ComponentItem}
		title={"Album"}
		icon={"fa-record-vinyl text-gray-700"}
		items={albumComponents}
		onSelect={onSelectComponent}
		selectedItem={selectedComponent}
		reorder={true}
	>
		{#snippet actions()}
			<button 
				class="text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
				use:tooltip={"New component"}
				on:click={() => newComponent('album')}
			>
				<i class="fa-solid fa-plus text-xs"></i>
			</button>
		{/snippet}

		{#snippet itemActions(item, ctx)}
			<button 
				aria-label="Move up"
				class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
				class:hidden={ctx.first()}
				on:click={() => ctx.up()}
				use:tooltip={"Up"}
			>
				<i class="fa-solid fa-chevron-up text-[9px]"></i>
			</button>
			
			<button 
				aria-label="Move down"
				class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
				class:hidden={ctx.last()}
				on:click={() => ctx.down()}
				use:tooltip={"Down"}
			>
				<i class="fa-solid fa-chevron-down text-[9px]"></i>
			</button>

			{#if !item.builtin}
				<button class="text-gray-500 hover:text-red-500 transition-colors leading-none"
					aria-label="Delete"
					use:tooltip={"Delete"}
					on:click={() => deleteComponent(item)}
				>
					<i class="fa-solid fa-trash-can text-[10px]"></i>
				</button>
			{/if}
		{/snippet}
	</ListFlex>

	<ListFlex
		ItemComponent={ComponentItem}
		title={"Track"}
		icon={"fa-music text-pulse-accent"}
		items={trackComponents}
		onSelect={onSelectComponent}
		selectedItem={selectedComponent}
		reorder={true}
	>
		{#snippet actions()}
			<button 
				class="text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
				use:tooltip={"New component"}
				on:click={() => newComponent('track')}
			>
				<i class="fa-solid fa-plus text-xs"></i>
			</button>
		{/snippet}
		{#snippet itemActions(item, ctx)}
			<button 
				aria-label="Move up"
				class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
				class:hidden={ctx.first()}
				on:click={() => ctx.up()}
				use:tooltip={"Up"}
			>
				<i class="fa-solid fa-chevron-up text-[9px]"></i>
			</button>
			
			<button 
				aria-label="Move down"
				class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
				class:hidden={ctx.last()}
				on:click={() => ctx.down()}
				use:tooltip={"Down"}
			>
				<i class="fa-solid fa-chevron-down text-[9px]"></i>
			</button>

			{#if !item.builtin}
				<button class="text-gray-500 hover:text-red-500 transition-colors leading-none"
					aria-label="Delete"
					use:tooltip={"Delete"}
					on:click={() => deleteComponent(item)}
				>
					<i class="fa-solid fa-trash-can text-[10px]"></i>
				</button>
			{/if}
		{/snippet}
	</ListFlex>
</div>

{/if}

