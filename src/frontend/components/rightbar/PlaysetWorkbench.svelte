<script>

import { tooltip } from '../../actions';

import { isOverlapping } from '../../utils/time';
import { activeEditPlayset, activeEditPlaysetMembers } from '../../stores/selection';
import { updatePlaysetMeta } from '../../stores/playsets';

import Header from './WorkbenchHeader.svelte';
// import PlaysetMemberItem from './PlaysetMemberItem.svelte';
import SetItem from './SetItem.svelte';
import ListFlex from '../ui/ListFlex.svelte';

const playsetMembers = activeEditPlaysetMembers.store;



</script>

<div class="flex flex-col h-full bg-black/20 p-4">
	<Header item={$activeEditPlayset} onChange={updatePlaysetMeta} />

	<div class="mb-4">
		<h2 class="text-xs font-black uppercase tracking-widest text-orange-500">Playset Scheduler</h2>
		<p class="text-[10px] text-gray-500">Drag Albums/Playlists here to schedule</p>
	</div>

	{#if $playsetMembers.length > 0}
		<ListFlex
			ItemComponent={SetItem}
			items={playsetMembers}
			reorder={true}
			visibleItems={1000}
		>
			{#snippet itemActions(item, ctx)}
				<button 
					aria-label="Move up"
					class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
					disabled={ctx.first()}
					on:click={() => ctx.up()}
					use:tooltip={"Up"}
				>
					<i class="fa-solid fa-chevron-up text-[9px]"></i>
				</button>
				
				<!-- Move Down -->
				<button 
					aria-label="Move down"
					class="w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-gray-500 hover:text-pulse-accent"
					disabled={ctx.last()}
					on:click={() => ctx.down()}
					use:tooltip={"Down"}
				>
					<i class="fa-solid fa-chevron-down text-[9px]"></i>
				</button>
				<button 
					aria-label="Remove"
					on:click={() => ctx.rm()}
					use:tooltip={"Remove"}
					class="text-red-500"
				>
					<i class="fa-solid fa-remove text-[10px]"></i>
				</button>
			{/snippet}
		</ListFlex>

	{:else}
		<div class="py-10 text-center pointer-events-none bg-white/5">
			<i class="fa-solid fa-plus-circle text-gray-700 text-xl mb-2"></i>
			<p class="text-[10px] text-gray-600 italic">Drop collections here</p>
		</div>
	{/if}
</div>
