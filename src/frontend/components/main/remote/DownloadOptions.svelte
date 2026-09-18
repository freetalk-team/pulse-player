<script>

import Checkbox from '../../ui/controls/Checkbox.svelte';
import RadioGroup from '../../ui/controls/RadioGroup.svelte';

export let show = false;
export let opt = {};
export let onConfirm;
export let item = { artist: 'Alice', name: 'Rock Beats', index: '01', title: 'Never Born' };

const overwriteOptions = [
	{ id: 'skip', label: 'Skip' },
	{ id: 'move', label: 'Move' },
	{ id: 'copy', label: 'Copy' }
];

// const MUSIC_DIR = window.process?.env?.USERPROFILE 
// 	? `${window.process.env.USERPROFILE}\\Music` // Windows
// 	: `${window.process.env.HOME}/Music`;        // macOS/Linux


// // Local state copies for cancel buffer safety
// let rootDir = opt.rootDir;
// let subdirPattern = opt.subdirPattern;
// let filenamePattern = opt.filenamePattern;
// let skipDialog = opt.skipOptions;

// Real-time visual pattern previewer
$: previewPath = `${opt.rootDir}/${opt.subdirPattern?.trim()}/${opt.filenamePattern?.trim()}.mp3`
	.replaceAll('[ARTIST]', item.artist || 'Alice')
	.replaceAll('[ALBUM]', item.name || 'Rock Beats')
	.replaceAll('[ALBUM_YEAR]', item.year ? `${item.name} (${item.year})` : item.name)
	.replace('[GENRE]', item.genre || 'Rock')
	.replace('[INDEX]', '01')
	.replace('[TITLE]', 'Track title')
	.replace(/\/+/g, '/'); // Clean up any duplicate backslashes

async function browseDirectory() {
	const selected = await api.dialogOpenDirectory(opt.rootDir);
	if (selected) 
		opt.rootDir = Array.isArray(selected) ? selected[0] : selected;
}

function confirm() {
	show = false;
	onConfirm?.(item, opt);
}

function close() {
	show = false;
}

function handleKeyDown(event) {
	// Only trigger close if the modal is currently open and Escape is pressed
	if (show && event.key === 'Escape') {
		close();
	}
}

// Helper to determine OS default Music path fallback safely
/*
const defaultMusicPath = window.process?.env?.USERPROFILE 
	? `${window.process.env.USERPROFILE}\\Music` // Windows
	: `${window.process.env.HOME}/Music`;        // macOS/Linux
*/

function placeholders(vars) {
	return vars
		.map(i => `<span class="text-zinc-300 font-mono">${i.toUpperCase()}</span>`)
		.join(', ');
}

</script>

<svelte:window on:keydown={handleKeyDown} />

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
		<div class="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900 p-6 text-white shadow-2xl">
			
			<h2 class="text-lg font-bold tracking-tight">Download Configuration</h2>
			<p class="text-xs text-gray-400 mt-1">Customize how your media files are structured locally.</p>

			<div class="mt-4 space-y-4">
				<!-- 1. Root Directory Row -->
				<div>
					<label>Root Storage Folder</label>
					<div class="flex gap-2">
						<input type="text" bind:value={opt.rootDir} class="flex-1" readonly />
						<button on:click={browseDirectory} class="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20 transition-all">
							Browse
						</button>
					</div>
				</div>

				<!-- 2. Sub Path Pattern Row -->
				<div>
					<label class="">Folder Structure Pattern</label>
					<input type="text" bind:value={opt.subdirPattern} class="w-full" />
					<p class="text-[10px] text-gray-500 mt-1">Available placeholders: {@html placeholders(opt.subdirPlaceholders)}</p>
				</div>

				<!-- 3. Filename Pattern Row -->
				<div>
					<label>Filename Structure Pattern</label>
					<input type="text" bind:value={opt.filenamePattern} class="w-full" />
					<p class="text-[10px] text-gray-500 mt-1">Available placeholders: {@html placeholders(opt.filenamePlaceholders)}</p>
				</div>

				<!-- Real-time Preview Area -->
				<div class="rounded-xl bg-black/50 p-3 border border-white/5 font-mono text-[11px] text-purple-400 break-all">
					<span class="text-gray-500 block text-[9px] uppercase font-sans font-bold tracking-wider mb-1">Structure Output Preview:</span>
					{previewPath}
				</div>

				<!-- 4. Don't Ask Checkbox -->
				<!-- <label class="flex items-center gap-2 cursor-pointer mt-2 text-sm select-none">
					<input type="checkbox" bind:checked={skipDialog} class="rounded border-white/10 bg-black/40 text-purple-600 focus:ring-0 focus:ring-offset-0 w-4 h-4" />
					<span class="text-gray-300 text-xs">Don't show this confirmation settings dialog again</span>
				</label> -->

				<div>
					<label>Overwrite action:</label>
					<RadioGroup options={overwriteOptions} bind:value={opt.overwrite} accent={"purple"} />
				</div>

				<div class="mt-4 space-y-4">
					<!-- Clean, Integrated Font Awesome Custom Checkbox -->
					<div class="pt-2">
						<Checkbox 
							bind:checked={opt.skipOptions} 
							label="Don't show this dialog again"
							accent={"purple"}
						/>
					</div>
				</div>
			</div>

			<!-- Action Buttons Footer -->
			<div class="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
				<button on:click={close} class="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
					Cancel
				</button>
				<button on:click={confirm} class="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">
					Start Download
				</button>
			</div>

		</div>
	</div>
{/if}

<style>

@reference '../../../assets/main.css';

label {
	@apply block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5;
}

input {
	@apply rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:border-purple-500;
}

</style>