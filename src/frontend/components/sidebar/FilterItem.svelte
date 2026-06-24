<script>

import Badge from "../ui/Badge.svelte";

export let item;
export let isSelected = false;
export let onSelect = () => {};


</script>

<div 
	role="button" tabindex="0"
	on:click={() => onSelect(item)}
	on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(item)}
	class="group flex items-center gap-3 p-2 rounded-md transition-all cursor-pointer
		{isSelected 
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
	
	<Badge count={item.count} />
</div>