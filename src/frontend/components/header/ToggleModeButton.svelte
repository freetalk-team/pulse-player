<script>

import { tooltip } from "../../actions";

export let title = '';
export let enabled;
export let icon = '';


</script>

<label class="text-2xl relative cursor-pointer group" 
	use:tooltip={title + ($enabled ? ' Off' : ' On')}
>
	<input 
		type="checkbox" 
		class="peer hidden"
		checked={$enabled}
		on:change={(e) => enabled.set(e.target.checked)}
	/>
	
	<div class="toggle">
		<i class="fa-solid {icon}"></i> 
	</div>
</label>

<style>

@reference "../../assets/main.css";

.toggle {
	@apply w-10 h-10 flex items-center justify-center rounded-lg transition-all text-gray-500 hover:text-pulse-white peer-checked:bg-pulse-accent peer-checked:text-black peer-checked:shadow-[0_0_10px_rgba(29,185,84,0.4)];
}

</style>