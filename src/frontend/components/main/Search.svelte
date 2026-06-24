<script>

import { fade } from 'svelte/transition';

export let query = '';
export let placeholder = 'Library';
export let onInput = () => {};

let searchInput; // Referencedd for the input element
let timeout;

const TIMEOUT = 400;

function clearSearch() {
	query = "";
	onInput(query);
}

function handleKeydown(e) {
	// Detect Ctrl+F or Cmd+F (Mac)
	if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
	  e.preventDefault(); // Stop the browser's default search find
	  searchInput?.focus();
	  searchInput?.select(); // Optional: select existing text for quick re-typing
	}

	if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
		e.preventDefault();
		searchInput?.focus();
	}
}

function handleInput() {
	if (timeout)
		clearTimeout(timeout);

	timeout = setTimeout(() => {
		timeout = null;
		onInput(query);
	}, TIMEOUT);
}
	
</script>

<!-- Listen for keys on the entire window -->
<svelte:window on:keydown={handleKeydown} />

<div class="p-2" style="-webkit-app-region: no-drag">
	<div class="relative max-w-md">
		<i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs"></i>
		<input
			type="text"
			bind:this={searchInput} 
			bind:value={query}
			on:input={handleInput}
			on:keydown={(e) => e.key === 'Escape' && clearSearch()}
			placeholder="Search in {placeholder}..." 
			spellcheck="false"
			class="w-full bg-pulse-white/5 border border-pulse-white/10 rounded-full py-2 pl-10 pr-4 text-sm outline-none focus:border-pulse-accent/50 focus:bg-pulse-white/10 transition-all"
		/>

		<!-- CLEAR BUTTON (Visible only when $searchQuery has value) -->
		{#if query}
		<button 
			on:click={clearSearch}
			transition:fade={{ duration: 150 }}
			class="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-white/10 hover:text-white transition-all"
			title="Clear Search"
		>
			<i class="fa-solid fa-circle-xmark text-sm"></i>
		</button>
		{/if}
	</div>
</div>