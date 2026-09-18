<script>

import { onMount } from "svelte";
import { fade } from "svelte/transition";

import { sleep } from "../../../../utils/sleep";

import { getDownloadOptions } from "../../../../stores/remote/downloads";
import { getPreviewPath, placeholders } from "./common";

let updatingOptions = false;

let opt = {
	rootDir: '',
	subdirPattern: '',
	filenamePattern: '',
	subdirPlaceholders: [],
	filenamePlaceholders: [],
	overwrite: 'skip'
};


$: previewPath = getPreviewPath(opt);

onMount(() => {
	opt = getDownloadOptions('recording');
});

async function updateDownloadOptions() {

	updatingOptions = true;

	await Promise.all([
		api.setPref('dir.recording', opt),
		sleep(300)
	]);

	updatingOptions = false;

	report.success('Recording download options updated');
}

async function browseDirectory() {
	const selected = await api.dialogOpenDirectory(opt.rootDir);

	if (selected) 
		opt.rootDir = Array.isArray(selected) ? selected[0] : selected;
}

</script>

<section class="relative panel">
	<h3 class="head">
		<i class="fa-solid fa-record-vinyl mr-2"></i>
		Recording	
	</h3>
	{#if updatingOptions}
		<div out:fade={{ duration: 300 }} class="absolute h-full backdrop-blur-sm z-30 inset-0 flex flex-col items-center justify-center bg-pulse-bg z-50">
			<div class="w-12 h-12 border-2 border-pulse-accent/20 border-t-pulse-accent rounded-full animate-spin mb-4"></div>
		</div>
	{/if}
	
	<div class="mt-4 space-y-6 p-4">
		<!-- 1. Root Directory Row -->
		<div>
			<label class="label">Root Storage Folder</label>
			<div class="flex gap-3">
				<input type="text" bind:value={opt.rootDir} class="flex-1 input" readonly />
				<button on:click={browseDirectory} class="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-all">
					Browse
				</button>
			</div>
		</div>

		<!-- 2. Sub Path Pattern Row -->
		<div>
			<label class="label">Folder Structure Pattern</label>
			<input type="text" bind:value={opt.subdirPattern} class="w-full input" />
			<p class="text-[10px] text-gray-500 mt-1">Available placeholders: {@html placeholders(opt.subdirPlaceholders)}</p>
		</div>

		<!-- 3. Filename Pattern Row -->
		<div>
			<label class="label">Filename Structure Pattern</label>
			<input type="text" bind:value={opt.filenamePattern} class="w-full input" />
			<p class="text-[10px] text-gray-500 mt-1">Available placeholders: {@html placeholders(opt.filenamePlaceholders)}</p>
		</div>

		<!-- Real-time Preview Area -->
		<div class="input text-pulse-accent font-mono text-[11px] break-all">
			<span class="text-gray-500 block text-[9px] uppercase font-sans font-bold tracking-wider mb-1">Structure Output Preview:</span>
			{previewPath}
		</div>

		<button on:click={updateDownloadOptions} 
			class="rounded-lg px-5 py-2 text-sm font-medium text-white transition-all hover:shadow-md"
			class:bg-blue-600={!updatingOptions}
			class:hover:bg-blue-500={!updatingOptions}
			class:shadow-blue-800={!updatingOptions}
			class:bg-gray-800={updatingOptions}
			class:text-gray-500={updatingOptions}
			disabled={updatingOptions}
		>
			Update
		</button>
	</div>
</section>
