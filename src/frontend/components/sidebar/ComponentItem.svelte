<script>

import { enableComponent } from "../../stores/components";

import ToggleButton from "../ui/ToggleButtonSmall.svelte";

export let item;
export let isSelected = false;
export let onSelect = () => {}

function handleToggle(enable) {
	enableComponent(item, enable);
}

</script>

<div 
	class="group/item flex flex-grow items-center gap-3 p-2 rounded-md cursor-pointer transition-all
	{isSelected ? 'bg-pulse-white/10 border-pulse-accent' : 'hover:bg-pulse-white/5'}"
	class:border-l-2={isSelected}
	on:click={() => !isSelected && onSelect(item)}
>
	<!-- <div class="w-10 h-10 rounded shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-700">
		<i class="fa-solid fa-record-vinyl fa-2x"></i>
	</div> -->
	<div class="flex-grow flex-column min-w-0 pl-2">
		<div class="flex items-center mb-2">
			<h4 class="flex-grow min-w-0 text-sm font-semibold truncate transition-colors text-pulse-white/60 group-hover/item:text-pulse-white">
				{item.name}
			</h4>
			<div 
				class="hidden group-hover/item:flex items-center gap-2 pr-1 h-full transition-all" 	on:click|stopPropagation
			>
				<slot name="actions" />
			</div>
		</div>
		<div class="flex items-center">
			<span class="flex-grow truncate pr-2 text-[10px] text-gray-500 italic">
				{item.description}
			</span>
			<div class="hidden group-hover/item:flex opacity-80" on:click|stopPropagation>
				<ToggleButton enabled={item.enabled} onToggle={handleToggle} />
			</div>
		</div>
	</div>
</div>