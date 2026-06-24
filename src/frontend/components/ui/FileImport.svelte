<script>

import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';
import { fade } from 'svelte/transition';

import { sleep } from '../../utils/sleep';

import { importProgress as progress, isImporting } from '../../stores/tracks';

let fileInput;
let isUploading = false;
let fileName = '';

// Smoothly animated progress value (0 to 100)
// const progress = tweened(0, {
// 	duration: 400,
// 	easing: cubicOut
// });

async function handleFileSelect(event) {
	const file = event.target.files[0];
	if (!file) return;

	fileName = file.name;
	isUploading = true;
	progress.set(0);

	// Simulate upload/processing logic
	for (let i = 0; i <= 100; i += 1) {
		if (!isUploading) break; // Handle cancelation

		await sleep(300);

		progress.set(i);
	}
	
	if (isUploading) {
		setTimeout(() => { isUploading = false; }, 5000);
	}
}

function cancelImport() {
	isUploading = false;
	progress.set(0);
	if (fileInput) fileInput.value = ''; // Reset input
}

</script>

<div class="relative w-full max-w-sm flex items-center">
	<input 
		type="file" 
		bind:this={fileInput} 
		on:change={handleFileSelect} 
		class="hidden" 
	/>

	{#if !$isImporting}
		<!-- INITIAL BUTTON -->
		<button 
			on:click={() => fileInput.click()}
			in:fade={{ duration: 200 }}
			class="w-full h-full py-2 bg-pulse-accent text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
		>
			<i class="fa-solid fa-file-import"></i>
			<span>Import Files</span>
		</button>
	{:else}
		<!-- PROGRESS VIEW -->
		<div 
			in:fade={{ duration: 200 }}
			class="w-full h-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-1 py-1 flex items-center gap-4 relative overflow-hidden text-sm"
		>
			<!-- BACKGROUND PROGRESS BAR -->
			<div 
				class="absolute inset-0 bg-pulse-accent/20 transition-all" 
				style="width: {$progress}%"
			></div>

			<div class="flex-1 flex flex-col z-10 truncate">
				<span class="text-[10px] text-white/50 uppercase font-bold truncate">Importing files</span>
				<span class="text-xs font-black text-white italic">Importing... {Math.round($progress)}%</span>
			</div>

			<button 
				on:click={cancelImport}
				class="flex-shrink-0 z-10 w-8 h-8 p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-red-500 transition-colors"
			>
				<i class="fa-solid fa-xmark"></i>
			</button>
		</div>
	{/if}
</div>
