<script>

export let item;
export let hasError = false;


import Stat from '../sidebar/Stat.svelte';
import TimePicker from '../ui/TimePicker.svelte';

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

<div class="flex items-center gap-3 mb-2 {hasError ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}">
	<i class="fa-solid {item.icon} {item.icon_color} text-[10px]"></i>
	<span class="flex-grow text-xs font-bold truncate">{item.name}</span>
	<Stat {item} />
</div>

<div class="flex items-center gap-1.5 ml-auto">
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


