<script>

import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

/**
 * @typedef {Object} RadioOption
 * @property {string|number} id - Unique identifier for the option.
 * @property {string} label - Display text label.
 * @property {string} [icon] - Optional FontAwesome class name (e.g., 'fa-solid fa-bolt').
 * @property {boolean} [disabled] - Optional flag to disable the item.
 * @property {string} [badge] - Optional tiny label pill text (e.g., 'PRO').
 */

// Component API Props
/** @type {RadioOption[]} */
export let options = [];

/** @type {string|number} */
export let value = '';

/** @type {string} - Active accent theme profile color: 'purple' | 'indigo' | 'amber' | 'emerald' */
export let accent = 'pulse';

/** @type {string} - Sizing preset: 'sm' | 'md' | 'lg' */
export let size = 'md';

// Track layout indexes to position the absolute sliding slider backdrop
$: activeIndex = options.findIndex(opt => opt.id === value);
$: totalOptions = options.length;

// Map sizing presets to Tailwind height/padding utilities
const sizeClasses = {
	sm: { container: 'h-8 p-0.5 rounded-lg text-xs gap-0.5', item: 'px-2.5 rounded-md' },
	md: { container: 'h-10 p-1 rounded-xl text-xs gap-1', item: 'px-4 rounded-lg' },
	lg: { container: 'h-12 p-1.5 rounded-2xl text-sm gap-1.5', item: 'px-5 rounded-xl' }
};

// Map accent parameters to custom Tailwind dynamic style states
const accentClasses = {
	pulse: {
		bg: 'bg-pulse-accent/60 shadow-pulse-accent/20 text-pulse-white',
		text: 'text-pulse-accent',
		badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
	},
	purple: {
		bg: 'bg-purple-600 shadow-purple-600/20 text-white',
		text: 'text-purple-400',
		badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
	},
	indigo: {
		bg: 'bg-indigo-600 shadow-indigo-600/20 text-white',
		text: 'text-indigo-400',
		badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
	},
	amber: {
		bg: 'bg-amber-500 shadow-amber-500/20 text-zinc-950 font-bold',
		text: 'text-amber-400',
		badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
	},
	emerald: {
		bg: 'bg-emerald-600 shadow-emerald-600/20 text-white',
		text: 'text-emerald-400',
		badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
	}
};

/**
 * Updates active value binding state and dispatches execution events upstream
 * @param {RadioOption} option
 */
function handleSelect(option) {
	if (option.disabled) return;
	value = option.id;
	
	// Dispatch structured custom change event to consumer parent components
	dispatch('change', { value, option });
}

/**
 * Adds primitive keyboard control routines to step selections sideways using arrow hotkeys
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
	if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
		e.preventDefault();
		let nextIdx = (activeIndex + 1) % totalOptions;
		// Skip disabled items if cycling forward
		while (options[nextIdx].disabled && nextIdx !== activeIndex) {
			nextIdx = (nextIdx + 1) % totalOptions;
		}
		handleSelect(options[nextIdx]);
	} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
		e.preventDefault();
		let prevIdx = (activeIndex - 1 + totalOptions) % totalOptions;
		// Skip disabled items if cycling backward
		while (options[prevIdx].disabled && prevIdx !== activeIndex) {
			prevIdx = (prevIdx - 1 + totalOptions) % totalOptions;
		}
		handleSelect(options[prevIdx]);
	}
}
</script>

<!-- Main Container Base Wrapper Box -->
<div 
	class="relative flex items-center bg-pulse-white/10 border border-zinc-800/80 shadow-inner select-none overflow-hidden max-w-full {sizeClasses[size].container}"
	role="radiogroup"
	aria-label="Horizontal Selection Menu Options"
	on:keydown={handleKeyDown}
	tabindex="0"
>
	<!-- Hardware-Accelerated Sliding Track Indicator Background Pill -->
	{#if activeIndex !== -1}
		<div 
			class="absolute rounded-lg top-1 bottom-1 transition-all duration-300 ease-out z-0 {accentClasses[accent].bg}"
			style:width="calc((100% - ({size === 'sm' ? '4px' : size === 'md' ? '8px' : '12px'})) / {totalOptions})"
			style:left="calc({size === 'sm' ? '2px' : size === 'md' ? '4px' : '6px'} + (({activeIndex} * (100% - ({size === 'sm' ? '4px' : size === 'md' ? '8px' : '12px'}))) / {totalOptions}))"
		></div>
	{/if}

	<!-- Individual Radio Selection Trigger Buttons Loop Matrix -->
	{#each options as option, index}
		{@const isActive = option.id === value}
		<button
			type="button"
			role="radio"
			aria-checked={isActive}
			aria-disabled={option.disabled}
			disabled={option.disabled}
			tabindex="-1"
			on:click={() => handleSelect(option)}
			class="relative flex-1 h-full flex items-center justify-center gap-2 font-medium tracking-wide transition-colors duration-200 z-10 focus:outline-none min-w-0 {sizeClasses[size].item}
				{isActive 
					? (accent === 'amber' ? 'text-zinc-950' : 'text-white') 
					: 'text-zinc-400 hover:text-zinc-200'} 
				{option.disabled ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'cursor-pointer'}"
		>
			<!-- Render Optional FontAwesome Vector Graphic Asset -->
			{#if option.icon}
				<i class="{option.icon} text-sm transition-transform duration-200 {isActive ? 'scale-105' : 'opacity-70'}"></i>
			{/if}

			<!-- Structural Label Text String -->
			<span class="truncate">{option.label}</span>

			<!-- Render Micro Premium Status Activation Badges if declared -->
			{#if option.badge}
				<span class="text-[9px] font-black tracking-tight px-1 py-0.5 rounded uppercase border transition-colors
					{isActive 
						? (accent === 'amber' ? 'bg-zinc-950/20 text-zinc-950 border-zinc-950/10' : 'bg-white/20 text-white border-white/20') 
						: accentClasses[accent].badge}"
				>
					{option.badge}
				</span>
			{/if}
		</button>
	{/each}
</div>

<!-- <style>
@reference "../../assets/main.css";

/* Ensures the dynamic indicator calculations animate smoothly inside Chromium engine shells */
div :global(.transition-all) {
	will-change: left, width;
}
</style> -->