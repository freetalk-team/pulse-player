<script>

import { fade } from 'svelte/transition';

import { clickOutside, dropdown } from '../../../actions';

export let value = "12:00"; // Always formats as "HH:MM"
export let id = "";
export let accent = "purple";

const accentClasses = {
	pulse: {
		border: 'border-pulse-accent/60 shadow-pulse-accent/10 shadow-sm',
		focus: 'focus:text-pulse-accent/90',
		text: 'text-pulse-accent-90',
		bg: 'bg-pulse-accent text-white font-bold'
	},
	purple: {
		border: 'border-purple-500 shadow-purple-500/10 shadow-sm',
		focus: 'focus:text-purple-400',
		text: 'text-purple-400',
		bg: 'bg-purple-600 text-white font-bold'
	}
};

let isFocused = false;
let isOpen = false;
let pickerElement;

// Core numeric text bindings
let hourString = value ? value.split(':')[0] : "12";
let minuteString = value ? value.split(':')[1] : "00";

// Track active selection focused column for panel scrolling alignments
let activeSelectionColumn = 'hour'; // 'hour' | 'minute'

// HTML input elements tracking anchors
let hourInputEl;
let minuteInputEl;
let activeInput;

// Reactively compute the upstream master string representation binding
$: value = `${hourString.padStart(2, '0')}:${minuteString.padStart(2, '0')}`;


// Direct Keyboard Numeric Input Constraints Validation
function handleHourInput(e) {
	let val = e.target.value.replace(/[^0-9]/g, '');
	if (val.length > 2) val = val.slice(-2);
	hourString = val;
	
	// Auto-focus next input field column if 2 digits are filled
	if (val.length === 2 || (parseInt(val) > 2 && val.length === 1)) {
		minuteInputEl?.focus();
		minuteInputEl?.select();
		activeSelectionColumn = 'minute';
	}
}

function handleHourBlur() {
	let num = parseInt(hourString) || 0;
	if (num > 23) num = 23;
	if (num < 0) num = 0;
	hourString = num.toString().padStart(2, '0');
}

function handleMinuteInput(e) {
	let val = e.target.value.replace(/[^0-9]/g, '');
	if (val.length > 2) val = val.slice(-2);
	minuteString = val;
}

function handleMinuteBlur() {
	let num = parseInt(minuteString) || 0;
	if (num > 59) num = 59;
	if (num < 0) num = 0;
	minuteString = num.toString().padStart(2, '0');
}

// Arrow Key Controls for Increments/Decrements
function handleKeyDown(e, column) {
	let currentNum = column === 'hour' ? parseInt(hourString) : parseInt(minuteString);
	let max = column === 'hour' ? 23 : 59;

	if (e.key === 'ArrowUp') {
		e.preventDefault();
		currentNum = currentNum >= max ? 0 : currentNum + 1;
		if (column === 'hour') hourString = currentNum.toString().padStart(2, '0');
		else minuteString = currentNum.toString().padStart(2, '0');
	} else if (e.key === 'ArrowDown') {
		e.preventDefault();
		currentNum = currentNum <= 0 ? max : currentNum - 1;
		if (column === 'hour') hourString = currentNum.toString().padStart(2, '0');
		else minuteString = currentNum.toString().padStart(2, '0');
	} else if (e.key === 'ArrowRight' && column === 'hour') {
		minuteInputEl?.focus();
		minuteInputEl?.select();
		activeSelectionColumn = 'minute';
	} else if (e.key === 'ArrowLeft' && column === 'minute') {
		hourInputEl?.focus();
		hourInputEl?.select();
		activeSelectionColumn = 'hour';
	}
	else if (e.key === 'Escape') {
		isOpen = false;
	}
}

function handleKeydown(e) {
	console.debug('On keydown');

	if (e.key === 'Escape') {
		isOpen = false;
	}
}

// Scroller click handlers
function selectHour(h) { hourString = h; }
function selectMinute(m) { minuteString = m; }

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

</script>

<div class="relative w-full"  
	on:keydown={handleKeydown}
	on:click={() => { isFocused = true; isOpen = true; }}
	use:clickOutside={() => { isFocused = false; isOpen = false; }}>
	<!-- Time Layout Control Frame Wrapper -->
	<div {id}
		bind:this={pickerElement}
		class="container {isFocused ? accentClasses[accent].border : 'border-zinc-800/80 hover:border-zinc-700'}"
	>
		<!-- Interactive Native Text Input Segments Row -->
		<div class="input-area">
			<input 
				bind:this={hourInputEl}
				type="text" 
				inputmode="numeric"
				value={hourString} 
				on:input={handleHourInput}
				on:blur={handleHourBlur}
				on:keydown={(e) => handleKeyDown(e, 'hour')}
				on:focus={() => { activeSelectionColumn = 'hour'; activeInput = hourInputEl; hourInputEl.select(); }}
				class="{accentClasses[accent].focus}"
			/>
			<span class="text-zinc-600 px-0.5 animate-none">:</span>
			<input 
				bind:this={minuteInputEl}
				type="text" 
				inputmode="numeric"
				value={minuteString} 
				on:input={handleMinuteInput}
				on:blur={handleMinuteBlur}
				on:keydown={(e) => handleKeyDown(e, 'minute')}
				on:focus={() => { activeSelectionColumn = 'minute'; activeInput = minuteInputEl; minuteInputEl.select(); }}
				class="{accentClasses[accent].focus}"
			/>
		</div>

		<i class="fa-solid fa-clock text-xs {isFocused ? accentClasses[accent].text : 'text-zinc-500'}"></i>
	</div>

	<!-- Custom Floating Time Scroll Picker Panel Matrix -->
	{#if isOpen}
		<div 
			transition:fade={{ duration: 120 }}
			use:dropdown={pickerElement}
			class="dropdown fixed z-50 min-w-[200px]"
		>
			<!-- Left Grid: Hour Scroller Column -->
			<div class="section auto-hide-scrollbar">
				<p>Hour</p>
				{#each hours as h}
					<button 
						type="button"
						on:click={() => selectHour(h)}
						class="{hourString === h ? accentClasses[accent].bg : 'item'}"
					>
						{h}
					</button>
				{/each}
			</div>

			<!-- Vertical Separation Line -->
			<div class="w-px h-full bg-zinc-800/60 self-stretch"></div>

			<!-- Right Grid: Minute Scroller Column -->
			<div class="section auto-hide-scrollbar">
				<p>Min</p>
				{#each minutes as m}
					<button 
						type="button"
						on:click={() => selectMinute(m)}
						class="{minuteString === m ? accentClasses[accent].bg : 'item'}"
					>
						{m}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>

@reference "../../../assets/main.css";

.container {
	@apply w-full bg-zinc-950 border flex items-center justify-between px-3 h-[38px] rounded-xl transition-all duration-200 cursor-text;
}

:global(.light-theme) .container {
	@apply bg-zinc-300;
}

.container .input-area {
	@apply flex items-center font-mono text-sm tracking-wide text-zinc-200 select-all;
}

:global(.light-theme) .container .input-area {
	@apply text-zinc-950;
}

.container .input-area input {
	@apply w-5 bg-transparent border-none p-0 text-center focus:outline-none select-all;
}

/* Turn off standard number input spin wheels */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

.custom-mini-scrollbar::-webkit-scrollbar {
	width: 4px;
}
.custom-mini-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-mini-scrollbar::-webkit-scrollbar-thumb {
	@apply bg-zinc-800 rounded-full hover:bg-zinc-700;
}

.dropdown {
	@apply p-3 flex gap-2 h-44 overflow-hidden;
}

.dropdown .section {
	@apply flex-1 space-y-0.5 text-center snap-y snap-mandatory pr-0.5;
}

.dropdown .section > p {
	@apply text-[9px] font-black tracking-wider text-zinc-600 uppercase sticky top-0 bg-zinc-950 py-1 z-20 rounded-md mb-1;
}

:global(.light-theme) .dropdown .section > p {
	@apply bg-zinc-400 text-zinc-950;
}

.dropdown .section > button {
	@apply w-full py-1 text-xs rounded-md font-mono transition-colors font-medium text-center block snap-center;
}

.dropdown .section > button.item {
	@apply text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200; 
}

:global(.light-theme) .dropdown .section > button.item {
	@apply text-zinc-600 hover:bg-zinc-400 hover:text-zinc-950;
}

</style>
