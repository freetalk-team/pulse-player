<script>

export let item;
export let isSelected = false;

</script>

<div
	class="group/item relative flex items-center flex-grow gap-2 p-1 rounded-md transition-all select-none cursor-pointer
	{isSelected ? 'bg-pulse-white/10 border-pulse-accent' : 'hover:bg-pulse-white/5'}"
	class:border-l-2={isSelected}
>
	<div class="flex justify-center items-center w-10 h-10 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
		<i class="fa-solid {item.icon || 'fa-computer'} text-[14px] {item.icon_color || 'text-pulse-accent'}"></i>
	</div>
	<div class="flex flex-col">
		<h3 class="flex-grow text-sm font-semibold truncate text-pulse-white/60 group-hover/item:text-pulse-white">
			{item.name}
		</h3>
		<!-- <p class="text-sm text-gray-600">
			<i>{`${item.address}:${item.port}`}</i>
		</p> -->
	</div>
</div>