<script>

import { fade } from 'svelte/transition';
import { onMount } from 'svelte'

import { clickOutside, portal } from '../../../actions';

export let value = new Date().toISOString().split('T')[0]; // Formats as "YYYY-MM-DD"
export let id = "";

let isOpen = false;
let pickerElement;
let position = {};

// Parse out active selection components
$: selectedDate = new Date(value + 'T00:00:00');
$: currentYear = selectedDate.getFullYear();
$: currentMonth = selectedDate.getMonth();

const monthNames = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];

function togglePicker() {
	if (!isOpen) calculatePlacement();
	isOpen = !isOpen;
}

function calculatePlacement() {
	if (!pickerElement) return;

	const rect = pickerElement.getBoundingClientRect();
	const spaceBelow = window.innerHeight - rect.bottom;
	const margin = 6;

	if (spaceBelow < 280) {
		position.direction = 'bottom';
		position.y = window.innerHeight - rect.top + margin;
	} else {
		position.direction = 'top';
		position.y = rect.bottom + margin;
	}

	position.right = window.innerWidth - rect.right;
	
}

let frame;

function handleScroll() {
	if (!isOpen) return;
	if (frame) return;

	frame = requestAnimationFrame(() => {
		frame = undefined;
		calculatePlacement();
	});
}

onMount(() => {
	calculatePlacement();

	window.addEventListener('scroll', handleScroll, true);
	window.addEventListener('resize', handleScroll);

	return () => {
		window.removeEventListener('scroll', handleScroll, true);
		window.removeEventListener('resize', handleScroll);

		if (frame) cancelAnimationFrame(frame);
	};
});



// Generate accurate calendar grid array for the currently viewed month
function generateCalendarGrid(year, month) {
	const firstDayIndex = new Date(year, month, 1).getDay();
	const totalDays = new Date(year, month + 1, 0).getDate();
	
	let days = [];
	// Fill empty padding cells for previous month hangover offset
	for (let i = 0; i < firstDayIndex; i++) {
		days.push(null);
	}
	// Fill calendar days
	for (let i = 1; i <= totalDays; i++) {
		days.push(i);
	}
	return days;
}

$: calendarDays = generateCalendarGrid(currentYear, currentMonth);

function selectDay(day) {
	if (!day) return;
	const y = currentYear;
	const m = (currentMonth + 1).toString().padStart(2, '0');
	const d = day.toString().padStart(2, '0');
	value = `${y}-${m}-${d}`;
	isOpen = false;
}

function adjustMonth(step) {
	let newMonth = currentMonth + step;
	let newYear = currentYear;
	if (newMonth > 11) {
		newMonth = 0;
		newYear++;
	} else if (newMonth < 0) {
		newMonth = 11;
		newYear--;
	}
	// Safely map to the 1st of the newly chosen month to prevent rollover invalid dates
	value = `${newYear}-${(newMonth + 1).toString().padStart(2, '0')}-01`;
}



// Formatting output helper string mapping
$: displayString = selectedDate.toLocaleDateString('en-US', { 
	month: 'short', 
	day: 'numeric', 
	year: 'numeric' 
});
</script>

<div class="relative w-40" bind:this={pickerElement} use:clickOutside={() => isOpen = false}>
	<!-- Custom Text Field Trigger Layout Panel -->
	<button 
		{id}
		type="button"
		on:click|stopPropagation={togglePicker}
		class="pick 
			{isOpen ? 'border-purple-500 shadow-sm shadow-purple-500/10' : 'border-zinc-800/80 hover:border-zinc-700'}"
	>
		<span class="truncate">{displayString}</span>
		<i class="fa-solid fa-calendar text-zinc-500 text-[11px] transition-colors {isOpen ? 'text-purple-400' : ''}"></i>
	</button>

	<!-- Custom Floating Calendar Matrix Panel Dropdown -->
	{#if isOpen}
		<div
			transition:fade={{ duration: 120 }}
			use:portal
			class="dropdown fixed z-50 p-3 w-64"
			style="
				right: {position.right}px;
				{position.direction}: {position.y}px;
			"
		>
			<!-- Calendar Header controls -->
			<div class="head">
				<button type="button" on:click={() => adjustMonth(-1)}>
					<i class="fa-solid fa-chevron-left text-[10px]"></i>
				</button>
				<span>{monthNames[currentMonth]} {currentYear}</span>
				<button type="button" on:click={() => adjustMonth(1)}>
					<i class="fa-solid fa-chevron-right text-[10px]"></i>
				</button>
			</div>

			<!-- Weekday Abbreviation Label Headers -->
			<div class="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-zinc-600 mb-1 uppercase">
				<span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
			</div>

			<!-- Calendar Days Items Grid Layer -->
			<div class="grid grid-cols-7 gap-1">
				{#each calendarDays as day}
					{@const isTodaySelected = day && value === `${currentYear}-${(currentMonth+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`}
					{#if day === null}
						<div class="w-full aspect-square"></div>
					{:else}
						<button
							type="button"
							on:click={() => selectDay(day)}
							class="w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium font-mono transition-all
								{isTodaySelected 
									? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20' 
									: 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}"
						>
							{day}
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>

@reference '../../../assets/main.css';

button.pick {
	@apply w-full bg-zinc-950 border text-left flex items-center justify-between px-3 h-[34px] rounded-xl transition-all duration-200 text-xs font-semibold text-zinc-300 focus:outline-none;
}

:global(.light-theme) button.pick {
	@apply bg-zinc-300/50 text-zinc-950 border-zinc-500/60;
}

.dropdown .head {
	@apply flex items-center justify-between border-b border-zinc-900 pb-2 mb-2;
}

.dropdown .head span {
	@apply text-xs font-bold text-pulse-white tracking-wide;
}

.dropdown .head button {
	@apply w-6 h-6 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors flex items-center justify-center;
}

</style>