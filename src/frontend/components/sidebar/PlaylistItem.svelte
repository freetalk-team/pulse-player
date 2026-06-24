<script>

import Stat from './Stat.svelte';
import Rating from './Rating.svelte';

export let item;
export let index;

export let isSelected = false;
export let isDragOver = false;
export let isDropAllowed = true;
export let isDropped = false;
export let isRenaming = false;
export let onRename;

let editName = item.name;

function focusInput(node) {
	node.focus();
	node.select();
}

function handleSave() {

	const name = editName.trim();

	if (name !== "" && name !== item.name)
		onRename(item, name);
}

function handleKey(e) {
	if (e.key === 'Enter') 
		handleSave();
}


</script>

<div
	class="group/item relative flex flex-grow flex-col p-1 rounded-md transition-all select-none cursor-pointer
	{isSelected ? 'bg-pulse-white/10 border-pulse-accent' : 'hover:bg-pulse-white/5'}
	{isDragOver 
		? isDropAllowed
			? 'bg-pulse-accent/15 ring-pulse-accent/30'
			: 'bg-red-500/15 ring-red-500/30'
		: ''
	}"
	class:border-l-2={isSelected}
	class:ring-1={isDragOver}
	class:ring-inset={isDragOver}
>
	<!-- TOP ROW -->
	<div class="flex items-center justify-between mb-1">
		<div class="flex flex-grow w-full items-center gap-3 rounded cursor-pointer">
			<div class="flex justify-center items-center w-12 h-12 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
				<i class="fa-solid {item.icon || 'fa-music'} text-[20px] {item.icon_color || 'text-pulse-accent'}"></i>
			</div>

			<div class="flex-grow flex-column truncate">

				<div class="flex flex-grow @container/inline-size">
					{#if isRenaming}
						<!-- RENAME INPUT -->
						<input 
							use:focusInput
							bind:value={editName}
							on:blur={handleSave}
							on:keydown={handleKey}
							on:click|stopPropagation
							class="bg-white/10 border-none outline-none text-sm text-white rounded px-1 w-full"
							spellcheck="false"
						/>
					{:else}
						<h4 class="flex-grow text-sm font-semibold truncate text-pulse-white/60 group-hover/item:text-pulse-white">
							{item.name}
						</h4>

						{#if isDropped}
							<div class="relative flex items-center justify-center w-4 h-4">
								<span class="absolute w-4 h-4 bg-green-500/40 rounded-full animate-ping"></span>
								<i class="fa-solid fa-check text-green-400 text-[10px]"></i>
							</div>
						{:else}
							<div class="flex items-center justify-end gap-2 h-5">
								
								<div class="hidden group-hover/item:flex items-center gap-2 pr-1 h-full transition-all" on:click|stopPropagation>
									<slot name="actions" />
								</div>
								<!-- TRACK COUNT (Hidden on hover) -->
								<div class="group-hover/item:hidden transition-all hidden @[200px]:block">
									<Stat item={item}/>
								</div>
							</div>
						{/if}
					{/if}
				</div>

				<!-- BOTTOM ROW -->
				<div class="flex justify-between items-center text-[10px] text-gray-500 italic">
					<span class="opacity-60">{item.genre || 'Various'}</span>
					{#if isDragOver && isDropAllowed}
						<span class="text-pulse-accent font-bold not-italic animate-pulse">Drop to Add</span>
					{:else}
						{#if item.total_rating > 0}
							<Rating rating={item.total_rating} />
						{/if}
					{/if}
				</div>

			</div>
		</div>
	</div>
</div>