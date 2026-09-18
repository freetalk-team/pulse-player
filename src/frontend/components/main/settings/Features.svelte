<script>

import { onMount } from "svelte";
import { fade } from "svelte/transition";
import { slide } from 'svelte/transition';

import pkg from '@pkg';

import { sleep } from "../../../utils/sleep";

let activationKey = '';
let activationStatus;
let isActivating = false;
let errorMessage = '';
let features = [];

$: if (activationKey) {
	// 1. Strip everything except alphanumeric characters
	let clean = activationKey.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
	
	// 2. Safely slice out the components if they exist
	let parts = [];
	if (clean.length > 0) parts.push(clean.slice(0, 2));   // "PP"
	if (clean.length > 2) parts.push(clean.slice(2, 6));   // "7M9K"
	if (clean.length > 6) parts.push(clean.slice(6, 10));  // "TX2Q"
	if (clean.length > 10) parts.push(clean.slice(10, 14)); // "84WN"
	
	// 3. Re-join them with a clean hyphen delimiter
	activationKey = parts.join('-');
}

$: isKeyTyped = activationKey.length > 0;
// $: isKeyComplete = activationKey.length === 19;
$: isValidFormat = /^PP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(activationKey);

onMount(async () => {
	features = await api.getFeatures();
});

async function handleActivationSubmit() {

	if (!isValidFormat) return;

	isActivating = true;
	activationStatus = 'idle';
	errorMessage = "";

	// Send the payload cleanly via ContextBridge API to Main Process
	// const result = await api.activatePro(activationKey);
	const [result] = await Promise.all([
		api.activatePro(activationKey),
		sleep(2000)
	]);

	if (result.success) {
		activationStatus = 'success';
		features = result.features;
	} else {
		activationStatus = 'error';
		errorMessage = result.message;
	}

	isActivating = false;
}
	
</script>

<div class="p-6 gap-4" in:fade>

	<h1 class="text-pulse-white/80 bg-pulse-white/5 font-black tracking-wider rounded-xl p-4 text-3xl">
		<i class="fa-solid fa-crown mr-4"></i>
		Features
	</h1>

	<div class="max-w-4xl mx-auto px-6 py-8">
		<div class="space-y-4">

			{#each features as feature}
				<div class="item {feature.enabled ? 'border-emerald-500/30 bg-emerald-950/5' : ''}">
					<div class="space-y-0.5 pr-4">
						<h4>
							<i class="fa-solid {feature.icon} {feature.enabled ? 'text-emerald-400' : 'text-amber-500'}"></i> {feature.name}
						</h4>
						<p>{feature.description}</p>
					</div>
					{#if feature.enabled}
						<span class="badge active"><i class="fa-solid fa-check mr-1"></i> ACTIVE</span>
					{:else}
						<span class="badge locked">PRO ONLY</span>
					{/if}
				</div>
			{/each}
		</div>

		{#if features.length < 3}
		<div class="space-y-2 pt-5">
			{#if activationStatus !== 'success'}
				<div transition:slide={{ duration: 150 }} class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<div class="flex flex-col gap-1.5 text-left relative">
						<label class="text-[11px] font-bold uppercase tracking-wider text-zinc-400" for="pro-key">Already purchased a key?</label>
						<input 
							id="pro-key"
							type="text" 
							bind:value={activationKey} 
							disabled={isActivating}
							placeholder="PP-XXXX-XXXX-XXXX" 
							spellcheck="false" 
							maxlength="19"
							class="input-field font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal uppercase 
								{activationStatus === 'error' ? 'border-red-500/60 focus:border-red-500 text-red-400 bg-red-950/10' : 'border-zinc-800 focus:border-amber-500/80 text-amber-400'}" 
						/>
					</div>

					<div class="p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 h-[42px] self-end">
						<span class="text-[11px] text-zinc-400 font-medium">Need a premium key?</span>
						<a href="{pkg.homepage}/features" target="_blank" rel="noopener noreferrer" class="btn-upgrade whitespace-nowrap">
							Get Key <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]"></i>
						</a>
					</div>
				</div>
			{/if}

			<!-- Server Error Notice Bar Banner -->
			{#if activationStatus === 'error'}
				<div transition:slide={{ duration: 150 }} class="mt-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-left flex items-center gap-2 text-xs text-red-400 font-medium">
					<i class="fa-solid fa-triangle-exclamation text-sm"></i>
					<span>{errorMessage}</span>
				</div>
			{/if}

			<div class="footer mt-4">
				<button
					class="btn-primary transition-all duration-200"
					class:bg-amber-600={isKeyTyped && isValidFormat}
					class:hover:bg-amber-500={isKeyTyped && isValidFormat}
					class:bg-zinc-800={isKeyTyped && !isValidFormat}
					class:text-zinc-500={isKeyTyped && !isValidFormat}
					class:cursor-not-allowed={isKeyTyped && !isValidFormat || isActivating}
					disabled={(isKeyTyped && !isValidFormat) || isActivating}
					on:click={handleActivationSubmit}
				>
					{#if isActivating}
						Verifying Key...
					{:else if isKeyTyped}
						{#if isValidFormat}
							Activate Pro
						{:else}
							Invalid License Key Pattern
						{/if}
					{:else}
						Activate Pro
					{/if}
				</button>
			</div>
		</div>

		{/if}
	</div>

</div>

<style>

@reference '../../../assets/main.css';

.footer {
	@apply flex w-full mt-auto pt-4;
}

.item {
	@apply flex items-start justify-between p-2.5 bg-zinc-950/30 border border-zinc-800/60 rounded-xl transition-colors duration-300;
}

.item h4 {
	@apply font-semibold text-zinc-200 flex items-center gap-1.5;
}

.item h4 > i {
	@apply text-[12px] mr-2;
}

.item p {
	@apply text-[12px] text-zinc-500;
}

.badge {
	@apply text-[11px] font-bold uppercase px-2 py-0.5 rounded border self-center whitespace-nowrap;
}

.badge.active {
	@apply bg-emerald-500/10 text-emerald-400 border border-emerald-500/20;
}

.badge.locked {
	@apply bg-amber-500/10 text-amber-400 border-amber-500/20;
}

.btn-primary {
	@apply px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center;
}

.btn-upgrade {
	@apply px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-lg text-xs transition shadow-sm flex items-center justify-center;
}

.input-field {
	@apply w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-colors placeholder:text-zinc-700;
}

.input-field.error {
	@apply border-red-500/80 focus:border-red-500 text-red-200 bg-red-950/10;
}

</style>