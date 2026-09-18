<script>

import { Colors } from '../ui/icons';

import Stat from '../sidebar/Stat.svelte';
import TimePicker from '../ui/TimePicker.svelte';

export let item;
export let hasError = false;

const [icon, iconColor] = item.icon.split(' ');

function updateTime(item, type, val) {
	// Logic to update start/end time in DB

	if (type == 'start') {
		item.start_time = val;
	}
	else {
		item.end_time = val;
	}
}

</script>

<div class="group/item flex flex-col p-2 min-w-0 w-full rounded-md hover:bg-pulse-white/5">

	<div class="flex items-center gap-3 mb-2 h-5 {hasError ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}">
		<i class="fa-solid {icon} text-[12px]" style:color={Colors[iconColor || 'slate']}></i>
		<span class="flex-grow text-xs font-bold truncate">{item.name}</span>

		<div class="flex flex-shrink-0 items-center gap-2 hidden group-hover/item:block" on:click|stopPropagation>
			<slot name="actions" />
		</div>
		<div class="group-hover/item:hidden">
			<Stat duration={item.total_duration} count={item.track_count} />
		</div>
	</div>

	<div class="flex items-center gap-1.5">
		<TimePicker 
			value={item.start_time}
			error={hasError}
			onChange={(val) => updateTime(item, 'start', val)} 
		/>
		<!-- <span class="text-gray-700 text-[10px]">—</span>
		<TimePicker 
			value={item.end_time} 
			onChange={(val) => updateTime(item, 'end', val)} 
		/> -->
	</div>

</div>


