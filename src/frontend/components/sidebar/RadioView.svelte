<script>

import { onMount } from 'svelte';

import { tooltip } from '../../actions';

import { favourite, recent, loadStations, selectStation, selectView, currentStation, selectedView, play, toggleFavourite } from '../../stores/radio';
import { activeRecordings } from '../../stores/recordings';

import RadioItem from './RadioItem.svelte';
import RecordingItem from './RecordingItem.svelte';
import List from '../ui/ListFlex.svelte';

onMount(() => loadStations());

</script>

<div class="group/item item {$selectedView == 'stations' ? 'selected' : 'notselected'}"
	on:click={() => selectView('stations')}
>
	<div class="icon">
		<i class="fa-solid fa-rss text-violet-400"></i>
	</div>
	<h2>
		Online Stations
	</h2>
</div>

{#if __PLATFORM__ === 'desktop'}
	<div class="group/item item {$selectedView == 'recordings' ? 'selected' : 'notselected'}"
		on:click={() => selectView('recordings')}
	>
		<div class="icon">
			<i class="fa-solid fa-record-vinyl text-red-300"></i>
		</div>
		<h2>
			Scheduled recordings
		</h2>
	</div>
{/if}

<List 
	ItemComponent={RecordingItem}
	title="Recordings"
	icon="fa-record-vinyl"
	iconColor="text-violet-300"
	items={activeRecordings}
	hideEmpty={true}
/>

<List 
	ItemComponent={RadioItem}
	title="Favourite" 
	icon="fa-heart"
	iconColor="text-red-300"
	items={favourite}
	onSelect={selectStation}
	selectedItem={$currentStation}
	hideEmpty={true}
>
	{#snippet itemActions(item)}
		<button class="hover:scale-110 transition-transform leading-none" 
			on:click={() => toggleFavourite(item)}
			use:tooltip={"Unfavourite"}
		>
			<i class="fa-solid fa-heart text-red-500 text-xs"></i>
		</button>
		<button class="text-pulse-accent hover:scale-110 transition-transform leading-none" 
			on:click={() => play(item)}
			use:tooltip={"Play"}
		>
			<i class="fa-solid fa-circle-play text-xs"></i>
		</button>
	{/snippet}
</List>
	
<List 
	ItemComponent={RadioItem}
	title="Recent" 
	icon="fa-clock"
	iconColor="text-orange-300"
	items={recent}
	onSelect={selectStation}
	selectedItem={$currentStation}
	hideEmpty={true}
>
	{#snippet itemActions(item)}
		<button class="hover:scale-110 transition-transform leading-none" 
			on:click={() => toggleFavourite(item)}
			use:tooltip={"Favourite"}
		>
			<i class="fa-regular fa-heart text-xs"></i>
		</button>
		<button class="text-pulse-accent hover:scale-110 transition-transform leading-none" 
			on:click={() => play(item)}
			use:tooltip={"Play"}
		>
			<i class="fa-solid fa-circle-play text-xs"></i>
		</button>
	{/snippet}
</List>

<style>

@reference "../../assets/main.css";

.item {
	@apply flex items-center gap-2 mb-2 rounded-md transition-all select-none cursor-pointer;
}

.item.notselected {
	@apply hover:bg-pulse-white/5;
}

.item.selected {
	@apply bg-pulse-white/10 border-pulse-accent border-l-2;
}

.item > .icon {
	@apply flex justify-center items-center w-12 h-12 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent;
}

.item > .icon > i {
	@apply text-[20px];
}

.item > h2 {
	@apply font-semibold text-pulse-white/60 group-hover/item:text-pulse-white;
}

</style>
