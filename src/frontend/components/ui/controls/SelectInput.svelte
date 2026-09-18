<script>

import { scale } from 'svelte/transition';
import { clickOutside, dropdown } from '../../../actions';

export let items = [];
export let value = "";
export let onChange;
export let validate = null; 

let trigger;
let isOpen = false;
let error = "";

$: if (validate) {
	const validationResult = validate(value);
	if (typeof validationResult === 'string') {
		error = validationResult; // Error message text string string
	} else {
		error = validationResult ? "" : "Invalid input selection"; // Boolean fallback
	}
} else {
	error = ""; // Clear state if no validator is present
}

function show() {
	isOpen = true;
}

function select(v) {
	value = v;
	isOpen = false;

	onChange?.(v);
}

function handleChange() {
	if (!error)
		onChange?.(value);
}

function handleKeydown(e) {
	if (e.key === 'Escape')
		isOpen = false;
}

</script>

<div class="relative w-full" use:clickOutside={() => (isOpen = false)}>

	<div class="relative w-full">

		<input 
			bind:this={trigger}
			bind:value
			on:focus={show}
			on:input={show}
			on:change={handleChange}
			on:keydown={handleKeydown}
			placeholder="Search or type..."
			class="w-full select truncate pr-8 {error ? 'border-red-500/60 focus:border-red-500 bg-red-950/5' : ''}"
		/>

		{#if error}
            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 flex items-center pointer-events-none" title={error}>
                <i class="fa-solid fa-circle-exclamation text-xs"></i>
            </div>
        {/if}
	</div>

	<!-- Micro validation error string alert layout banner row -->
    <!-- {#if error}
        <div transition:slide={{ duration: 120 }} class="text-[10px] text-red-400 font-semibold text-left mt-1 pl-1 tracking-wide">
            {error}
        </div>
    {/if} -->

	{#if isOpen && items.length > 0}
		<div 
			transition:scale={{ duration: 150, start: 0.95 }}
			use:dropdown={trigger}
			class="fixed z-100 flex flex-col dropdown max-h-48 custom-scroll py-1"
		>
			{#each items as item}
				<button 
					on:click={() => select(item)}
					class="w-full text-left px-3 py-2 text-[11px] hover:bg-pulse-accent/10 hover:text-pulse-accent transition-colors {value === item ? 'bg-white/5 text-pulse-accent' : 'text-gray-400'}"
				>
					{item}
				</button>
			{/each}
		</div>
	{/if}
</div>


