<script>

import { fade, scale } from "svelte/transition";

import pkg from '@pkg';

import { isImporting } from "../../stores/import";


async function handleImportFolders() {
	const paths = await api.dialogOpenDirectory();
	handleImport(paths);
}

async function handleImport(paths) {
	if (!paths || paths.length === 0) return;
	
	try {
		console.debug('Scanning paths:', paths);
		
		await api.scanFolders(paths);
	} catch (err) {
		console.error(err);
	} finally {
	}
}

</script>

<div 
	in:fade={{ duration: 300 }}
	class="w-full h-full flex items-center justify-center bg-zinc-950/30 p-6 md:p-12 select-none relative overflow-hidden"
>
	<!-- Background Design Accent Elements -->
	<div class="absolute w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -top-44 -left-44 pointer-events-none"></div>
	<div class="absolute w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full -bottom-32 -right-32 pointer-events-none"></div>

	<!-- Centered Fixed-Dimension Two-Column Canvas Dashboard Card -->
	<div 
		in:scale={{ duration: 400, start: 0.98 }}
		class="flex w-full max-w-4xl h-[520px] rounded-3xl border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl overflow-hidden min-w-0 min-h-0"
	>
		
		<!-- =================================================== -->
		<!-- LEFT COLUMN: FLOATING VISUAL ACCENT FRAME          -->
		<!-- =================================================== -->
		<div class="hidden md:flex w-2/5 bg-zinc-950/80 border-r border-white/5 flex-col justify-between p-10 relative overflow-hidden">
			<!-- Decorative Vinyl / Soundwaves Mesh Array Core -->
			<div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
				<i class="fa-solid fa-waveform text-[24rem]"></i>
			</div>

			<!-- Top Brand Indicator -->
			<div class="flex items-center gap-2.5 relative z-10">
				<div class="w-7 h-7 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-purple-600/20">
					<i class="fa-solid fa-bolt-lightning text-xs animate-none"></i>
				</div>
				<span class="text-xs font-black uppercase tracking-widest text-zinc-400">{pkg.appname}</span>
			</div>

			<!-- Central Abstract Vinyl Spinner Hub -->
			<div class="flex flex-col items-center justify-center relative my-auto space-y-4">
				<div class="relative w-36 h-36 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 border border-white/10 flex items-center justify-center shadow-2xl">
					<!-- Concentric Grooves -->
					<div class="absolute inset-2 rounded-full border border-white/5"></div>
					<div class="absolute inset-6 rounded-full border border-white/5"></div>
					<div class="absolute inset-10 rounded-full border border-white/5"></div>
					
					<!-- Pulsating Core Note Graphic -->
					<div class="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 animate-pulse">
						<i class="fa-solid fa-music text-base"></i>
					</div>
				</div>
			</div>

			<!-- Bottom Context Advice Pointers -->
			<div class="relative z-10 text-left">
				<p class="text-[11px] text-zinc-500 font-medium leading-normal flex items-start gap-2">
					<i class="fa-solid fa-shield-halved text-zinc-600 text-xs mt-0.5"></i>
					<span>Your local data remains entirely sandboxed offline. No tracks or profile metrics are sent to remote networks.</span>
				</p>
			</div>
		</div>

		<!-- =================================================== -->
		<!-- RIGHT COLUMN: INTERACTIVE IMPORT ACTION PANEL       -->
		<!-- =================================================== -->
		<div class="flex-1 flex flex-col justify-between p-8 md:p-12 bg-zinc-900/20 min-w-0">
			<div class="w-full space-y-8 my-auto max-w-md mx-auto text-left">
				
				<!-- Onboarding Typography Callout headers -->
				<div class="space-y-3">
					<h1 class="text-3xl font-black text-white tracking-tight leading-tight">
						Your music library <br />is currently empty.
					</h1>
					<p class="text-xs md:text-sm text-zinc-400 leading-relaxed">
						To get started, point the player to your local local archive folder directory. We'll scan your folders to extract ID3 tags, indexing layouts, and track records.
					</p>
				</div>

				<!-- Features Mini Checklist Preview Matrix -->
				<div class="space-y-3 pt-2">
					<div class="flex items-start gap-3">
						<div class="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
							<i class="fa-solid fa-check text-[10px]"></i>
						</div>
						<div>
							<h3 class="text-xs font-bold text-zinc-200">Lossless & Format Complete</h3>
							<p class="text-[11px] text-zinc-500 mt-0.5">Full audio framework decoder mappings for MP3, FLAC, WAV, M4A, and OGG stream configurations.</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
							<i class="fa-solid fa-check text-[10px]"></i>
						</div>
						<div>
							<h3 class="text-xs font-bold text-zinc-200">Local SQLite DB Schema</h3>
							<p class="text-[11px] text-zinc-500 mt-0.5">Blazing fast instant search indexing optimized to crawl archives of over 50,000 files in seconds.</p>
						</div>
					</div>
				</div>

				<!-- Action Launch CTA Segment -->
				<div class="pt-4 flex flex-col sm:flex-row items-center gap-4">
					<button 
						on:click={handleImportFolders}
						disabled={$isImporting}
						class="w-full sm:w-auto px-6 h-11 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed font-bold text-white rounded-xl text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 group"
					>
						{#if $isImporting}
							<i class="fa-solid fa-circle-notch animate-spin text-sm"></i>
							<span>Scanning Audio Folders...</span>
						{:else}
							<i class="fa-solid fa-folder-plus text-sm group-hover:scale-105 transition-transform"></i>
							<span>Import Music Directory</span>
						{/if}
					</button>
					
					<!-- {#if !isScanning}
						<button 
							type="button"
							on:click={() => dispatch('skip')}
							class="text-zinc-500 hover:text-zinc-300 text-xs font-semibold py-2 px-3 transition-colors"
						>
							Open Player Anyway
						</button>
					{/if} -->
				</div>
			</div>
		</div>

	</div>
</div>