<script>

import { onMount } from 'svelte';
import { derived } from 'svelte/store';

import { tooltip } from '../../actions';

import { currentSettings } from '../../stores/settings';
import { albumComponents, trackComponents, loadComponents, loadComponent, selectedComponent, newComponent, deleteComponent } from '../../stores/components';

import List from '../ui/List.svelte';
import ListFlex from '../ui/ListFlex2.svelte';
import ComponentItem from './ComponentItem.svelte';

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
		<div class="flex items-center gap-4">
			<div class="w-6 text-center text-lg">
				<i class="fa-solid {item.icon} {item.iconColor || ''}"></i>
			</div>
			<span class="text-sm font-semibold">{item.title}</span>
		</div>
	</div>

{/each}

{#if platform.import}

<div class="flex flex-col mt-4 gap-2">
	<h4 class="text-gray-500 truncate uppercase font-semibold tracking-wider px-2">
		<i class="fa-solid fa-code"></i>
		Components
	</h4>

	<!-- {#each $components as item}
		<ComponentItem {item} isSelected={item.id == selectedComponent?.id} onSelect={onSelectComponent} />
	{/each} -->

	<ListFlex
		title={"Album"}
		icon={"fa-record-vinyl text-gray-700"}
		itemComponent={ComponentItem}
		items={albumComponents}
		onSelect={onSelectComponent}
		selectedItem={selectedComponent}
		reorder={true}
	>
		<div slot="actions">
			<button 
				class="text-gray-500 w-4 h-4 hover:text-orange-500 transition-colors cursor-pointer"
				use:tooltip={"New component"}
				on:click={() => newComponent('album')}
			>
				<i class="fa-solid fa-plus text-xs"></i>
			</button>
		</div>
		<div 
			slot="item_actions"  
			class="gap-2 flex items-center"
			let:index let:count let:move let:item
		>
			{#if index > 0}
				<button 
					aria-label="Move up"
					class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
					disabled={index === 0}
					on:click|stopPropagation={() => move(index, -1)}
					use:tooltip={"Up"}
				>
					<i class="fa-solid fa-chevron-up text-[9px]"></i>
				</button>
			{/if}
			
			{#if index < count - 1}
				<!-- Move Down -->
				<button 
					aria-label="Move down"
					class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
					disabled={index === count - 1}
					on:click|stopPropagation={() => move(index, 1)}
					use:tooltip={"Down"}
				>
					<i class="fa-solid fa-chevron-down text-[9px]"></i>
				</button>
			{/if}

			{#if !item.builtin}
				<button class="text-gray-500 hover:text-red-500 transition-colors leading-none"
					aria-label="Delete"
					use:tooltip={"Delete"}
					on:click={() => deleteComponent(item)}
				>
					<i class="fa-solid fa-trash-can text-[10px]"></i>
				</button>
			{/if}
		</div>
	</ListFlex>

	<ListFlex
		title={"Track"}
		icon={"fa-music text-pulse-accent"}
		itemComponent={ComponentItem}
		items={trackComponents}
		onSelect={onSelectComponent}
		selectedItem={selectedComponent}
		reorder={true}
	>
		<div slot="actions">
			<button 
				class="text-gray-500 w-4 h-4 hover:text-orange-500 transition-colors cursor-pointer"
				use:tooltip={"New component"}
				on:click={() => newComponent('track')}
			>
				<i class="fa-solid fa-plus text-xs"></i>
			</button>
		</div>
		<div 
			slot="item_actions"  
			class="gap-2 flex items-center"
			let:index let:count let:move let:item
		>
			{#if index > 0}
				<button 
					aria-label="Move up"
					class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
					disabled={index === 0}
					on:click|stopPropagation={() => move(index, -1)}
					use:tooltip={"Up"}
				>
					<i class="fa-solid fa-chevron-up text-[9px]"></i>
				</button>
			{/if}
			
			{#if index < count - 1}
				<!-- Move Down -->
				<button 
					aria-label="Move down"
					class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
					disabled={index === count - 1}
					on:click|stopPropagation={() => move(index, 1)}
					use:tooltip={"Down"}
				>
					<i class="fa-solid fa-chevron-down text-[9px]"></i>
				</button>
			{/if}

			{#if !item.builtin}
				<button class="text-gray-500 hover:text-red-500 transition-colors leading-none"
					aria-label="Delete"
					use:tooltip={"Delete"}
					on:click={() => deleteComponent(item)}
				>
					<i class="fa-solid fa-trash-can text-[10px]"></i>
				</button>
			{/if}
		</div>
	</ListFlex>
</div>

{/if}

