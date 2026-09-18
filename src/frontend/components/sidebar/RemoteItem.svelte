<script>

import { Colors } from "../ui/icons";

import Badge from "../ui/BadgeCircle.svelte";

export let item;
export let isSelected = false;

</script>

<div
	class="group/item relative flex items-center flex-grow gap-2 p-1 rounded-md transition-all select-none cursor-pointer
	{isSelected ? 'bg-pulse-white/10 border-pulse-accent' : 'hover:bg-pulse-white/5'}"
	class:border-l-2={isSelected}
>
	<div class="flex justify-center items-center w-10 h-10 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
		<i class="fa-solid text-[14px] {item.icon || 'fa-computer'}" style:color={Colors[item.iconColor || 'accent']}></i>
	</div>
	<div class="flex flex-col flex-grow">
		<h3 class="flex-grow text-sm font-semibold truncate text-pulse-white/60 group-hover/item:text-pulse-white">
			{item.hostname}
		</h3>
		<!-- <p class="text-sm text-gray-600">
			<i>{`${item.address}:${item.port}`}</i>
		</p> -->
	</div>
	{#if item.unread > 0}
		<Badge count={item.unread} />
	{/if}
</div>