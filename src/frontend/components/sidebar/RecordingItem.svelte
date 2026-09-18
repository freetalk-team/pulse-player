<script>

import { tooltip } from '../../actions';
import { formatStationDescriptionHtml } from '../../utils/region';

import { stopRecording } from '../../stores/recordings';

import RecordingBadge from './RecordingBadge.svelte';

export let item;

</script>

<div in:fade={{ duration: 200 }}
	class="group/item flex items-center overflow-hidden flex-grow gap-2 px-1 py-2 rounded-md transition-all select-none hover:bg-pulse-white/5"
>
	<div class="relative flex justify-center items-center w-10 h-10 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
		{#if item.favicon}
			<img src="{platform.resolve(item.favicon)}" alt="" class="w-8 h-8 object-cover" />
		{:else}
			<i class="fa-solid fa-radio text-[18px] text-gray-600"></i>
		{/if}

		<i class="absolute bottom-0 right-0 text-[16px] fa-solid fa-compact-disc animate-spin [animation-duration:3s] text-red-600"></i>
	</div>
	<div class="flex-1 flex flex-col gap-1 overflow-hidden w-full">
		<div class="flex flex-1 items-center">
			<h3 class="flex-1 text-sm font-semibold truncate text-pulse-white/60 group-hover/item:text-pulse-white">
				{item.name}
			</h3>
		</div>
		<p class="text-[10px] opacity-80 truncate">
			{@html formatStationDescriptionHtml(item)}
		</p>
	</div>
	<div class="group-hover/item:hidden">
		<RecordingBadge />
	</div>
	<button class="hidden group-hover/item:block p-1 text-red-600"
		use:tooltip={"Stop"}
		on:click={() => stopRecording(item)}
	>
		<i class="fa-solid fa-stop text-sm"></i>
	</button>
</div>