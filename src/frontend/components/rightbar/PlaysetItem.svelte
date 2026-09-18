<script>

import { fade } from 'svelte/transition';

import { Colors } from '../ui/icons';

import DurationBadge from '../ui/DurationBadge.svelte';

export let item;
export let ctx;
export let actions;

const [icon, iconColor] = item.icon.split(' ');

</script>

<div
	in:fade={{ duration: 200 }}
	out:fade={{ duration: 150 }}
	class="group/track flex flex-grow w-full items-center gap-3 p-2 hover:bg-pulse-white/5 rounded cursor-pointer"
>

    <div class="flex justify-center items-center w-8 h-8 rounded flex-shrink-0 bg-gradient-to-br from-white/5 to-transparent">
        <i class="fa-solid {icon} text-[16px]" style:color={Colors[iconColor || 'slate']}></i>
    </div>
	<div class="flex-grow flex-column truncate space-y-1">
		<p class="text-xs font-medium truncate">{item.name}</p>
		<p class="text-[10px] text-gray-500 truncate">
			<span class="font-semibold text-pulse-accent/50 mr-2">{item.genre}</span>
			<i>{item.member_count} sets</i>
		</p>
	</div>
	<span class="text-[10px] text-gray-600 group-hover/track:hidden">
		<DurationBadge duration={item.total_duration} />
	</span>
	<div class="flex flex-shrink-0 items-center gap-2 hidden group-hover/track:flex" on:click|stopPropagation>
		{@render actions?.(item, ctx)}
	</div>
</div>