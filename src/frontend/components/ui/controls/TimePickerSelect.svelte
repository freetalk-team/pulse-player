<script>

import { slide, fade } from 'svelte/transition';

import { clickOutside } from '../../actions';

export let value = ""; // Formats as "HH:MM"
export let id = "";

let isOpen = false;
let pickerElement;
let dropDirection = 'bottom'; // 'bottom' or 'top'

// Separate tracking states for internal layout loops
let activeHour = value ? value.split(':')[0] : "12";
let activeMinute = value ? value.split(':')[1] : "00";

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

// Dynamically update component string bindings on modification loops
$: value = `${activeHour}:${activeMinute}`;

function togglePicker() {
	if (!isOpen) {
		calculatePlacement();
	}
	isOpen = !isOpen;
}

function calculatePlacement() {
	if (!pickerElement) return;
	
	const rect = pickerElement.getBoundingClientRect();
	const spaceBelow = window.innerHeight - rect.bottom;
	
	// If space below the selector container is less than 220px, flip it upward
	if (spaceBelow < 220) {
		dropDirection = 'top';
	} else {
		dropDirection = 'bottom';
	}
}

function selectHour(h) { activeHour = h; }
function selectMinute(m) { activeMinute = m; }


function handleKeydown(e) {
	if (e.key === 'Escape')
		isOpen = false;
}

</script>

<div class="relative w-full" bind:this={pickerElement} on:keydown={handleKeydown} use:clickOutside={() => isOpen = false}>
    <!-- Custom Text Field Trigger Layout Panel -->
    <button
        {id}
        type="button"
        on:click|stopPropagation={togglePicker}
        class="w-full bg-zinc-950 border text-left flex items-center justify-between px-3 py-2 text-xs text-zinc-200 h-[38px] rounded-xl transition-all duration-200 focus:outline-none 
            {isOpen ? 'border-purple-500 shadow-sm shadow-purple-500/10' : 'border-zinc-800/80 hover:border-zinc-700'}"
    >
        <span class="font-mono tracking-wider text-sm">{activeHour}:{activeMinute}</span>
        <i class="fa-solid fa-clock text-zinc-500 text-xs transition-colors {isOpen ? 'text-purple-400' : ''}"></i>
    </button>

    <!-- Custom Floating Time Scroll Picker Panel Matrix -->
    {#if isOpen}
        <div 
            transition:fade={{ duration: 120 }}
            class="absolute left-0 right-0 z-50 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-3 flex gap-2 h-44 overflow-hidden"
            class:bottom-full={dropDirection === 'top'}
            class:mb-2={dropDirection === 'top'}
            class:top-full={dropDirection === 'bottom'}
            class:mt-2={dropDirection === 'bottom'}
        >
            <!-- Left Grid: Hour Scroller column -->
            <div class="flex-1 overflow-y-auto custom-mini-scrollbar space-y-0.5 text-center snap-y snap-mandatory pr-0.5">
                <p class="text-[9px] font-black tracking-wider text-zinc-600 uppercase sticky top-0 bg-zinc-950 py-1 select-none z-20">Hour</p>
                {#each hours as h}
                    <button 
                        type="button"
                        on:click={() => selectHour(h)}
                        class="w-full py-1 text-xs rounded-md font-mono transition-colors font-medium text-center block snap-center
                            {activeHour === h ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
                    >
                        {h}
                    </button>
                {/each}
            </div>

            <!-- Vertical structural layout separation divider element -->
            <div class="w-px h-full bg-zinc-800/60 self-stretch"></div>

            <!-- Right Grid: Minute Scroller column -->
            <div class="flex-1 overflow-y-auto custom-mini-scrollbar space-y-0.5 text-center snap-y snap-mandatory pl-0.5">
                <p class="text-[9px] font-black tracking-wider text-zinc-600 uppercase sticky top-0 bg-zinc-950 py-1 select-none z-20">Min</p>
                {#each minutes as m}
                    <button 
                        type="button"
                        on:click={() => selectMinute(m)}
                        class="w-full py-1 text-xs rounded-md font-mono transition-colors font-medium text-center block snap-center
                            {activeMinute === m ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
                    >
                        {m}
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>

@reference "../../assets/main.css";

/* Discrete scroller parameters optimized for time selector scroll arrays */
.custom-mini-scrollbar::-webkit-scrollbar {
	width: 4px;
}
.custom-mini-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-mini-scrollbar::-webkit-scrollbar-thumb {
	@apply bg-zinc-800 rounded-full hover:bg-zinc-700;
}

</style>
