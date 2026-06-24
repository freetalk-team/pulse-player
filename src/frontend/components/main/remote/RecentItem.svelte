<script>

import { playAlbum } from "../../../stores/library";
import { playPlaylist } from "../../../stores/playlist";

import DurationBadge from "../../ui/DurationBadge.svelte";

export let item;

function handleClick() {
	switch (item.type) {
		case 'album':
		playAlbum(item);
		break;

		case 'playlist':
		playPlaylist(item);
		break;
	}
}

</script>

<div 
	class="group/item flex flex-grow items-center gap-3 p-2 rounded-md cursor-pointer transition-all hover:bg-pulse-white/5"
	on:click={handleClick}
>
	<div class="w-10 h-10 bg-pulse-main rounded shadow-lg overflow-hidden flex-shrink-0">
	{#if item.cover_path}
		<img src="{platform.resolve(item.cover_path)}" alt="" class="w-full h-full object-cover" />
	{:else}
		<div class="w-full h-full flex items-center justify-center text-gray-700">
			<i class="fa-solid fa-2x {item.icon} {item.icon_color}"></i>
		</div>
	{/if}
	</div>

	<div class="flex-grow flex-column min-w-0">
		<div class="flex items-center justify-between h-5">
			<h4 class="flex-grow min-w-0 text-sm font-semibold truncate transition-colors 
				text-pulse-white/60 group-hover/item:text-pulse-white"
			>
				{item.name}
			</h4>

			<div class="group-hover/item:hidden">
				<DurationBadge duration={item.total_duration} />
			</div>
		</div>
		<div class="flex justify-between items-center mt-0.5 h-5">
			<span class="truncate pr-2 text-[10px] text-gray-500 italic">
				{item.genre || 'Various'}
			</span>
		</div>
		
	</div>
</div>