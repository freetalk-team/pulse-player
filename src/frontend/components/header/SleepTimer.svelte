<script>

import { clickOutside, tooltip } from '../../actions';
import { sleepTimer, setSleepTimer } from '../../stores/ui';

let showMenu = false;
const options = [15, 30, 45, 60, null];

</script>

<div
	use:clickOutside={() => (showMenu = false)}
	class="relative flex items-center"
>
	<button 
		on:click|stopPropagation={() => showMenu = !showMenu}
		use:tooltip={"Sleep"}
		class="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-all {$sleepTimer ? 'text-pulse-accent' : 'text-gray-500'}"
	>
		<i class="fa-solid fa-moon text-xs"></i>
		{#if $sleepTimer}
			<span class="text-[10px] font-bold font-mono">{$sleepTimer}m</span>
		{/if}
	</button>

	{#if showMenu}
		<div class="absolute top-full right-0 mt-2 p-2 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col gap-1 w-24">
			<p class="text-[8px] uppercase font-black text-gray-600 px-2 mb-1">Sleep In</p>
			{#each options as opt}
				<button 
					on:click={() => { setSleepTimer(opt); showMenu = false; }}
					class="text-[10px] font-bold py-1.5 px-2 rounded hover:bg-pulse-accent hover:text-black text-left transition-all"
				>
					{opt ? `${opt} mins` : 'Off'}
				</button>
			{/each}
		</div>
	{/if}
</div>
