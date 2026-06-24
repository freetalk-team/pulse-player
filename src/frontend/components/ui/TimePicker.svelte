<script>

import { scale } from 'svelte/transition';

import { clickOutside, portal } from '../../actions';

export let value = "10:00"; // HH:mm
export let onChange;
export let placement = 'top';

let isOpen = false;
let dropdown; // Reference to the trigger
let button;
let coords = { top: 0, left: 0 };

let [h, m] = value ? value.split(':') : [null, null];

const hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
const minutes = ['00', '15', '30', '45']; // Quarter-hour increments for faster scheduling

function setTime(newH, newM) {
	h = newH;
	m = newM;

	if (!h) return;
	if (!m) m = '00';

	value = `${h}:${m}`;

	if (onChange) 
		onChange(value);
}

function toggle() {
	if (!isOpen) {
		const rect = button.getBoundingClientRect();
		// Calculate fixed position
		coords = {
			top: rect.top - 180, // Offset for menu height
			left: rect.left
		};
	}
	isOpen = !isOpen;
}

function scrollToActive(node) {
    const activeChild = node.querySelector('.bg-pulse-accent');
    if (activeChild) {
        // Use block: 'center' so it's not stuck at the very top/bottom
        activeChild.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
}

</script>

<div 
	class="relative inline-block"
>
	<!-- The Trigger Button -->
	<button
		bind:this={button}
		on:click|stopPropagation={toggle}
		class="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all group"
	>
		<i class="fa-regular fa-clock text-[10px] text-gray-500 group-hover:text-pulse-accent"></i>
		<span class="text-[11px] font-mono font-bold text-gray-200">{value}</span>
	</button>

	{#if isOpen}
		<!-- use:portal moves this div to the <body> so it's never clipped -->
		<div 
			use:portal
			bind:this={dropdown}
			use:clickOutside={() => (isOpen = false)}
			transition:scale={{ duration: 150, start: 0.95 }}
			class="fixed z-[9999] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 flex gap-2"
			style="top: {coords.top}px; left: {coords.left}px;"
		>
			<div
				use:scrollToActive
				class="flex flex-col gap-1 h-40 overflow-y-auto custom-scroll pr-1"
			>
				<p class="text-[8px] uppercase font-black text-gray-600 px-2 mb-1">Hour</p>
				{#each hours as hour}
					<button 
						on:click={() => setTime(hour, m)}
						class="text-[10px] px-3 py-1 rounded {h === hour ? 'bg-pulse-accent text-black' : 'hover:bg-white/5 text-gray-400'}"
					>
						{hour}
					</button>
				{/each}
			</div>

			<div class="w-px bg-white/5 h-auto my-2"></div>

			<!-- Minute Column -->
			<div class="flex flex-col gap-1">
				<p class="text-[8px] uppercase font-black text-gray-600 px-2 mb-1">Min</p>
				{#each minutes as min}
					<button 
						on:click|stopPropagation={() => setTime(h, min)}
						class="text-[10px] px-3 py-1 rounded {m === min ? 'bg-pulse-accent text-black' : 'hover:bg-white/5 text-gray-400'}"
					>
						{min}
					</button>
				{/each}
				<div class="mt-auto pt-2 border-t border-white/5">
					<button on:click|stopPropagation={() => isOpen = false} class="w-full text-[9px] font-bold text-gray-500 hover:text-white">CLOSE</button>
				</div>
			</div>
		</div>
	{/if}
</div>
