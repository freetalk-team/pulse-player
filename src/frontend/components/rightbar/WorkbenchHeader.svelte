<script>

import { slide } from 'svelte/transition';
import { onMount } from 'svelte';

import { editMode, activeEditPlaylist, activeEditPlayset } from '../../stores/selection';

import IconPicker from '../ui/controls/IconPicker.svelte';
import IconColor from '../ui/controls/IconColor.svelte';
import GenreSelect from '../ui/controls/GenreSelect.svelte';

export let item;
export let onChange;

let isCollapsed = false; // Track the state locally
let isAnimating = false; // Track animation state

$: [icon, iconColor] = item.icon.split(' ');


onMount(() => {
	isCollapsed = api.getPref('ui.workbenchCollapsed', false);
});

function toggleCollapse() {
	isCollapsed = !isCollapsed;

	api.setPref('ui.workbenchCollapsed', isCollapsed);
}

function handleFinish() {
	editMode.set(false);
	activeEditPlaylist.set(null);
	activeEditPlayset.set(null);
}

async function handleNameChange(e) {
	const newName = e.target.value.trim();
	if (newName !== "" && newName !== item.name) {
		// Reuse your existing rename logic to sync Sidebar + DB
		item.name = newName;
		onChange?.(item);
	}
}

function handleChange() {
	item.icon = `${icon} ${iconColor}`;
	onChange?.(item);
}


</script>

<div class="flex flex-col gap-4 border-b border-white/5 pb-4 mb-4">
	<!-- Top Row: Close/Finish -->
	<div class="flex justify-between items-center gap-1 p-1 rounded-md bg-pulse-white/5 border border-pulse-white/10">
		<div
			role="button"
			tabindex="0"
			on:click={toggleCollapse}
			on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleCollapse()}
			class="flex items-center gap-2 cursor-pointer group truncate"
		>
			<i class="fa-solid fa-chevron-down text-[8px] text-gray-600 transition-transform duration-300 {isCollapsed ? '-rotate-90' : ''}"></i>
			<span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors truncate">
				Workbench
			</span>
		</div>
		<button 
			on:click={handleFinish}
			class="flex-shrink-0 px-3 py-1 bg-white/5 hover:bg-pulse-accent hover:text-black rounded text-[10px] font-bold transition-all tracking-wider"
		>
			FINISH EDITING
		</button>
	</div>

	{#if !isCollapsed}
		<div 
			transition:slide={{ duration: 300 }} 
			on:introstart={() => isAnimating = true}
			on:introend={() => isAnimating = false}
			on:outrostart={() => isAnimating = true}
			class="mt-4 px-1 {isAnimating ? 'overflow-hidden' : 'overflow-visible'}"
		>
			<!-- Meta Row: Icon & Genre -->
			<div class="flex flex-col gap-2">
				<div class="flex flex-col gap-2">
					<label class="text-[9px] text-gray-500 uppercase">Name</label>
					<input 
						value={item.name}
						on:blur={handleNameChange}
						on:keydown={(e) => e.key === 'Enter' && e.target.blur()}
						class="bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-gray-700 w-full truncate focus:text-pulse-accent transition-colors"
						placeholder="Playlist Name..."
						spellcheck="false"
					/>
				</div>
				<!-- Icon Selector -->
				<div class="flex flex-col gap-2">
					<label class="text-[9px] text-gray-500 uppercase">Icon</label>
					<IconPicker 
						bind:value={icon} 
						color={iconColor}
						onSelect={handleChange}
					/>
				</div>

				<div class="flex flex-col gap-2 mt-2">
					<label class="text-[9px] text-gray-500 uppercase tracking-tighter">Icon Color</label>
					<IconColor 
						bind:value={iconColor} 
						onSelect={handleChange} 
					/>
				</div>

				<!-- Genre Selector -->
				<div class="flex flex-col gap-2">
					<label class="text-[9px] text-gray-500 uppercase">Genre</label>
					<GenreSelect 
						bind:value={item.genre} 
						onChange={handleChange}
					/>
				</div>
			</div>
		</div>
	{/if}
</div>
