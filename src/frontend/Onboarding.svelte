<script>

import { onMount } from 'svelte';
import { slide } from 'svelte/transition';

import MobileScreenShot from '@resources/mobile-app-screenshot.png?asset';

import { sleep } from './utils/sleep';
import { importProgress, isImporting, scanFolders } from './stores/import';
import { isDark } from './stores/ui';

import { Colors } from './components/ui/icons';

import IconPicker from './components/ui/controls/IconPicker.svelte';
import IconColor from './components/ui/controls/IconColor.svelte';
import Progress from './components/ui/Progress.svelte';
import Watermark from './components/main/Watermark.svelte';

export let complete = false;

let step = 1;
let selectedPath = "";
let remoteEnabled = true;
let hostname;
let username;
let icon;
let iconColor;
let activationKey = '';

// UI state flags
let isActivating = false;
let activationStatus = 'idle'; // 'idle' | 'success' | 'error'
let errorMessage = "";
let features = [];

const errors = {};

$: if (step === 3 && !$isImporting) {
	// Delay slightly for a smoother visual handoff after hitting 100%
	setTimeout(() => {
		if (step === 3) step = 4;
	}, 600);
}

// Automatically structures typing into the structural pattern: PP-7M9K-TX2Q-84WN
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
// $: hasKeyError = isKeyTyped && isKeyComplete && !isValidFormat;

onMount(async () => {

	features = await api.getFeatures();

	selectedPath = api.getPref('dir').music;
	//licensedFeatures = api.getPref('features');

	console.debug('Music dir:', selectedPath);
	//console.debug('Features:', licensedFeatures);

	const remote = api.getPref('remote');

	hostname = remote.name;
	username = remote.username;
	[icon, iconColor] = remote.icon.split(' ');
});

function prevStep() { step--; }
function nextStep() {
	if (isKeyTyped && !isValidFormat) return;
	step++; 
}

function skipPrevStep() { step -= 2; }
function skipNextStep() { step += 2; }

function finishSetup() {
	// 1. Commit final settings to Electron Store via IPC
	// 2. Trigger parent callback to close onboarding modal

	complete = true;
}

async function selectFolder() {
	// Example: Call your Electron main process dialog channel
	// const path = await window.electronAPI.selectDirectory();
	// if (path) selectedPath = path;

	const selected = await api.dialogOpenDirectory(selectedPath);

	if (selected) 
		selectedPath = selected;
}

function checkValid(e) {
	const input = e.target;

	if (input.value.length < 3)
		errors[input.name] = true;
	else
		errors[input.name] = false;
}

function handleImport() {
	console.debug('Start importing:', selectedPath);
	scanFolders(selectedPath);
	nextStep();
}

async function handleActivationSubmit() {
	if (!isKeyTyped) {
		step++; // Free route bypass
		return;
	}

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
		licensedFeatures = result.features;
	} else {
		activationStatus = 'error';
		errorMessage = result.message;
	}
	isActivating = false;
}

function completeOnboarding() {
	// // Mark onboarding complete in electron-store so it never triggers on launch again
	// if (window.api && window.api.setStoreValue) {
	//     window.api.setStoreValue('hasCompletedOnboarding', true);
	// }
	// Force the app parent window to reload or toggle visibility layouts
	window.location.reload(); 
}

</script>

<div class="relative overflow-hidden w-full h-full flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm select-none">

	<!-- =================================================== -->
	<!-- STEP 1: WELCOME SCREEN                              -->
	<!-- =================================================== -->
	<div class="view-slide" class:-translate-x-full={step > 1}>
		<div class="page">
			<!-- Left Side: Icon & Context -->
			<div class="sidebar bg-gradient-to-b from-indigo-950 to-zinc-950">
				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<i class="fa-solid fa-compact-disc text-5xl text-indigo-400 animate-spin [animation-duration:10s]"></i>
						<h2 class="text-3xl tracking-wider font-bold text-gray-300 text-shadow-lg/20">Welcome</h2>
					</div>
					<div class="space-y-1">
						<p class="text-xs text-zinc-400">Let's set up your new media player experience.</p>
					</div>
				</div>
			</div>
			<!-- Right Side: Content & Action -->
			<div class="main-content">
				<div class="relative h-full w-full">
					<Watermark />
					<div class="space-y-4 max-w-sm">
						<h1 class="text-3xl font-black tracking-tight text-white">Your music, offline.</h1>
						<p class="text-sm text-zinc-400 leading-relaxed">
							A lightweight audio setup engineered for speed, minimalism, and your local music archive. Ready to begin?
						</p>
					</div>
				</div>
				<div class="footer justify-end">
					<button class="btn-primary" on:click={nextStep}>
						Get Started <i class="fa-solid fa-arrow-right ml-2 text-xs"></i>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- =================================================== -->
	<!-- STEP 2: MUSIC DIRECTORY IMPORT                      -->
	<!-- =================================================== -->
	<div class="view-slide" 
		 class:-translate-x-full={step > 2} 
		 class:translate-x-full={step < 2} 
		 class:translate-x-0={step == 2}>
		<div class="page">
			<div class="sidebar bg-zinc-950">
				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<i class="fa-solid fa-folder-tree text-4xl text-amber-500"></i>
						<h2 class="text-3xl tracking-wider font-bold text-gray-300 text-shadow-lg/20">Library</h2>
					</div>
					<div class="space-y-1">
						<p class="text-xs text-zinc-400">Point the application to your audio files.</p>
					</div>
				</div>
			</div>
			<div class="main-content">
				<div class="relative h-full w-full">
					<Watermark />
					<div class="w-full space-y-4">
						<div>
							<label class="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2" for="dir-picker">Local Source Folder</label>
							<div class="flex gap-2">
								<input 
									id="dir-picker"
									type="text" 
									readonly 
									placeholder="No directory selected yet..." 
									value={selectedPath}
									class="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none placeholder:text-zinc-600"
								/>
								<button class="btn-secondary whitespace-nowrap" on:click={selectFolder}>
									<i class="fa-solid fa-folder mr-1"></i> Browse
								</button>
							</div>
						</div>
						<p class="text-xs text-zinc-500 leading-normal">
							<i class="fa-solid fa-circle-info mr-1 text-zinc-400"></i> Supported extensions include MP3, FLAC, M4A, OGG, MP4, MKV, and WAV. Scanning runs concurrently in the background.
						</p>

						<button 
							class="btn-primary" 
							disabled={!selectedPath} 
							on:click={handleImport}
						>
							Scan & Continue
						</button>
					</div>
				</div>
				<div class="footer">
					<button class="btn-text" on:click={prevStep}>Back</button>
					<button class="btn-primary" disabled={!selectedPath} on:click={skipNextStep}>Continue</button>
				</div>
			</div>
		</div>
	</div>

	<!-- =================================================== -->
    <!-- STEP 3: PROCESSING & IMPORTING LOADING STATE        -->
    <!-- =================================================== -->
    <div class="view-slide" 
         class:-translate-x-full={step > 3} 
         class:translate-x-full={step < 3} 
         class:translate-x-0={step == 3}>
        <div class="page">
            <!-- Left Side: Spinning Status Module -->
            <div class="sidebar bg-zinc-950 flex flex-col justify-center items-center gap-4 text-center p-8 select-none">
                <div class="relative flex items-center justify-center">
                    <!-- Outer pulsating orbit track ring -->
                    <div class="absolute inset-0 w-16 h-16 rounded-full border-2 border-indigo-500/20 animate-ping [animation-duration:2s]"></div>
                    <!-- Rotating vinyl / note tracker core -->
                    <div class="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 animate-spin [animation-duration:3s]">
                        <i class="fa-solid fa-compact-disc text-2xl"></i>
                    </div>
                </div>
                <div class="space-y-1">
                    <h2 class="text-lg font-bold tracking-tight text-zinc-200">Building Library</h2>
                    <p class="text-xs text-zinc-500">Indexing audio track records...</p>
                </div>
            </div>

            <!-- Right Side: Metrics Monitor Panel -->
            <div class="main-content flex flex-col justify-center items-center text-center px-12">
                <div class="w-full max-w-sm space-y-6">
                    <div class="space-y-2">
                        <h3 class="text-2xl font-black text-white tracking-tight">Analyzing Metadata</h3>
                        <p class="text-sm text-zinc-400 leading-relaxed">
                            Parsing ID3 audio tags, album artwork layouts, and populating local database engines. Please leave the application open.
                        </p>
                    </div>

                    <!-- Visual Progress Loader Container -->
                    <div class="w-full space-y-2 text-left">
                        <div class="flex justify-between items-center text-xs font-semibold tracking-wider text-zinc-400 px-0.5">
                            <span class="uppercase">Processing Files</span>
                            <span class="text-indigo-400 text-sm">{$importProgress}%</span>
                        </div>
                        
                        <!-- Track Progress Bar -->
						<Progress value={$importProgress} />
                    </div>
                </div>

                <!-- Footer Context: Intentionally lock navigation buttons during processing execution loop -->
                <div class="footer justify-center mt-8">
					<p class="text-[11px] text-zinc-600 flex items-center gap-1.5 select-none">
						<i class="fa-solid fa-lock text-[10px]"></i> Navigation locked until folder database cataloging wraps up
					</p>
                </div>
            </div>
        </div>
    </div>

	<!-- =================================================== -->
	<!-- STEP 3: APPEARANCE PREFERENCES                      -->
	<!-- =================================================== -->
	<div class="view-slide" 
		 class:-translate-x-full={step > 4} 
		 class:translate-x-full={step < 4} 
		 class:translate-x-0={step == 4}>
		<div class="page">
			<div class="sidebar bg-zinc-950">
				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<i class="fa-solid fa-palette text-4xl text-teal-400"></i>
						<h2 class="text-3xl tracking-wider font-bold text-gray-300 text-shadow-lg/20">Interface</h2>
					</div>
					<div class="space-y-1">
						<p class="text-xs text-zinc-400">Select a structural visual theme for your system layout.</p>
					</div>
				</div>
			</div>
			<div class="main-content">
				<div class="relative h-full w-full">
					<Watermark />
					<div class="grid grid-cols-2 gap-4 w-full">
						<!-- Dark Mode Option -->
						<button 
							on:click={() => isDark.set(true)} 
							class="theme group"
							class:selected={$isDark}
							class:notselected={!$isDark}
						>
							<i class="fa-solid fa-moon text-2xl {$isDark ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}"></i>
							<div>
								<p class="text-sm text-white font-semibold">Dark Theme</p>
								<p class="text-[11px] text-zinc-500 mt-0.5">Deep blacks and neons</p>
							</div>
						</button>
						<!-- Light Mode Option -->
						<button 
							on:click={() => isDark.set(false)}
							class="theme group"
							class:selected={!$isDark}
							class:notselected={$isDark}
						>
							<i class="fa-solid fa-sun text-2xl {!isDark ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-400'}"></i>
							<div>
								<p class="text-sm text-white font-semibold">Light Theme</p>
								<p class="text-[11px] text-zinc-500 mt-0.5">High-contrast slate profiles</p>
							</div>
						</button>
					</div>
				</div>
				<div class="footer">
					<button class="btn-text" on:click={skipPrevStep}>Back</button>
					<button class="btn-primary" on:click={nextStep}>Continue</button>
				</div>
			</div>
		</div>
	</div>

	<!-- =================================================== -->
	<!-- STEP X: REMOTE APP CONFIGURATION                    -->
	<!-- =================================================== -->
	<div class="view-slide" 
		class:-translate-x-full={step > 5} 
		class:translate-x-full={step < 5} 
		class:translate-x-0={step == 5}>
		<div class="page">

			<!-- Left Side: Icon & Context -->
			<div class="sidebar bg-zinc-950 flex flex-col justify-between h-full">
				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<i class="fa-solid fa-share-nodes text-4xl text-purple-400"></i>
						<h2 class="text-3xl tracking-wider font-bold text-gray-300 text-shadow-lg/20">Remote</h2>
					</div>
					<div class="space-y-1">
						<p class="text-xs text-zinc-400">Connect mobile companion devices over your local network.</p>
					</div>
				</div>

				<div class="relative w-full flex justify-center items-end mt-auto overflow-hidden px-6">
					<!-- Soft Glow Backdrop Layer behind the image asset -->
					<div class="absolute w-36 h-36 bg-purple-600/10 blur-2xl rounded-full bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"></div>
					
					<!-- Your Mobile App Asset Image Element -->
					<img 
						src="{MobileScreenShot}" 
						alt="Mobile App Interface" 
						class="w-[85%] h-auto object-contain object-bottom translate-y-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
						draggable="false"
					/>
				</div>

				<!-- New: Google Play Store Referral Section -->
				<div class="pt-4 border-t border-zinc-900 mt-auto space-y-2">
					<p class="text-[11px] text-zinc-500 font-medium leading-normal">
						Get the official controller app for your Android device:
					</p>
					<a 
						href="https://google.com" 
						target="_blank" 
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 transition-colors w-full group"
					>
						<i class="fa-brands fa-google-play text-emerald-400 group-hover:scale-105 transition-transform"></i>
						<span class="font-semibold tracking-tight">Get it on Google Play</span>
					</a>
				</div>
			</div>


			<!-- Right Side: Content & Forms -->
			<div class="main-content overflow-y-auto custom-scrollbar">
				<div class="w-full space-y-6">
					
					<!-- Your Custom Styled Checkbox Component Wrapper -->
					<label class="flex items-center gap-3 cursor-pointer select-none group text-xs text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80">
						<input 
							type="checkbox" 
							bind:checked={remoteEnabled} 
							class="sr-only" 
						/>

						<div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 relative overflow-hidden
							{remoteEnabled 
								? 'bg-purple-600 border-purple-500 shadow-md shadow-purple-600/20 scale-100' 
								: 'border-white/10 bg-black/40 group-hover:border-white/20'}"
						>
							<i class="fa-solid fa-check text-[10px] text-white transition-all duration-200 transform
								{remoteEnabled ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}"
							></i>
							<div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
						</div>

						<div class="flex flex-col text-left">
							<span class="font-semibold tracking-tight text-sm text-zinc-200">Enable Remote Connection Access</span>
							<span class="text-[11px] text-zinc-500 mt-0.5">Starts NSD discovery client and localized HTTP/REST web server profile.</span>
						</div>
					</label>

					<!-- Conditionally Display Options if Enabled -->
					{#if remoteEnabled}
						<div transition:slide={{ duration: 200 }} class="w-full flex flex-col sm:flex-row gap-6 bg-zinc-950/20 border border-zinc-800/40 p-4 rounded-xl">
							
							<!-- Left Preview Column -->
							<div class="w-full sm:w-44 flex-shrink-0 aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center self-start">
								<i class="fa-solid text-6xl {icon}" style:color={Colors[iconColor]}></i>
							</div>

							<!-- Right Input Fields Column -->
							<div class="flex flex-col gap-4 w-full">
								<div class="flex flex-col gap-1.5 text-left">
									<label class="text-xs font-semibold text-zinc-400" for="remote-hostname">Hostname</label>
									<input 
										id="remote-hostname"
										bind:value={hostname} 
										name="hostname" 
										on:input={checkValid} 
										spellcheck="false" 
										class="input-field" 
										class:error={errors['hostname']} 
									/>
								</div>

								<div class="flex flex-col gap-1.5 text-left">
									<label class="text-xs font-semibold text-zinc-400" for="remote-username">Username</label>
									<input 
										id="remote-username"
										bind:value={username} 
										name="username" 
										on:input={checkValid} 
										spellcheck="false" 
										class="input-field" 
										class:error={errors['username']} 
									/>
								</div>

								<div class="flex flex-col gap-1.5 text-left">
									<label class="text-xs font-semibold text-zinc-400">Icon Preference</label>
									<IconPicker bind:value={icon} bind:color={iconColor}  />
								</div>

								<div class="flex flex-col gap-1.5 text-left">
									<label class="text-xs font-semibold text-zinc-400">Accent Color Matrix</label>
									<IconColor bind:value={iconColor} />
								</div>
							</div>

						</div>
					{/if}

				</div>

				<!-- Frame Actions Footer -->
				<div class="footer">
					<button class="btn-text" on:click={prevStep}>Back</button>
					<button class="btn-primary" disabled={remoteEnabled && (!hostname || !username)} on:click={nextStep}>Continue</button>
				</div>
			</div>
		</div>
	</div>

	<!-- =================================================== -->
	<!-- STEP X: PREMIUM FEATURES & UPGRADE                  -->
	<!-- =================================================== -->
	<div class="view-slide" 
		class:-translate-x-full={step > 6} 
		class:translate-x-full={step < 6} 
		class:translate-x-0={step == 6}>
		<div class="page">
			<!-- Left Side: Icon & Marketing Context -->
			<div class="sidebar bg-zinc-950 flex flex-col justify-between h-full">
				<!-- <div class="space-y-4">
					<i class="fa-solid fa-crown text-4xl text-amber-500 animate-pulse"></i>
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight">Pro Features</h2>
						<p class="text-xs text-zinc-400 leading-normal">
							Unlock the full potential of your music experience.
						</p>
					</div>
				</div> -->

				<div class="space-y-6">
					<div class="flex items-center gap-4">
						<i class="fa-solid fa-crown text-4xl text-amber-500 animate-pulse"></i>
						<h2 class="text-3xl tracking-wider font-bold text-gray-300 text-shadow-lg/20">Pro Features</h2>
					</div>
					<div class="space-y-1">
						<p class="text-xs text-zinc-400 leading-normal">
							Unlock the full potential of your music experience.
						</p>
					</div>
				</div>

				<!-- Context Hint at the bottom of sidebar -->
				<div class="pt-4 border-t border-zinc-900 mt-auto">
					<p class="text-[11px] text-zinc-500 leading-normal">
						You can always complete your activation or review subscription settings inside the application settings dashboard later.
					</p>
				</div>
			</div>

			<!-- Right Side: Features Matrix & Checkout Call-to-Action -->
			<div class="main-content flex flex-col justify-between overflow-y-auto custom-scrollbar">
				<div class="w-full space-y-5 text-left">
					<div>
						<h3 class="text-xl font-black text-white tracking-tight">Supercharge Your Playback</h3>
						<p class="text-xs text-zinc-400 mt-0.5">Explore what you get with a premium upgrade package:</p>
					</div>

					<!-- Feature Matrix Tracker Layout -->
					<div class="space-y-2">
						<!-- Feature Row 1: Metadata Editor -->
						{#each features as feature}
								<div class="flex items-start justify-between p-2.5 bg-zinc-950/30 border border-zinc-800/60 rounded-xl transition-colors duration-300 {activationStatus === 'success' && feature.enabled ? 'border-emerald-500/30 bg-emerald-950/5' : ''}">
								<div class="space-y-0.5 pr-4">
									<h4 class="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
										<i class="fa-solid {feature.icon} {activationStatus === 'success' && feature.enabled ? 'text-emerald-400' : 'text-amber-500'} text-[10px]"></i> {feature.name}
									</h4>
									<p class="text-[11px] text-zinc-500">{feature.description}</p>
								</div>
								{#if activationStatus === 'success' && feature.enabled}
									<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-center whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> ACTIVE</span>
								{:else}
									<span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 self-center whitespace-nowrap">PRO ONLY</span>
								{/if}
							</div>
						{/each}
					</div>

					<!-- Inputs and Notifications Context Panel -->
					<div class="space-y-2 pt-1">
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
									<a href="https://yourwebsite.com" target="_blank" rel="noopener noreferrer" class="btn-upgrade whitespace-nowrap">
										Get Key <i class="fa-solid fa-arrow-up-right-from-square ml-1 text-[10px]"></i>
									</a>
								</div>
							</div>
						{/if}

						<!-- Server Error Notice Bar Banner -->
						{#if activationStatus === 'error'}
							<div transition:slide={{ duration: 150 }} class="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-left flex items-center gap-2 text-xs text-red-400 font-medium">
								<i class="fa-solid fa-triangle-exclamation text-sm"></i>
								<span>{errorMessage}</span>
							</div>
						{/if}
					</div>

				</div>

				<!-- Frame Actions Footer -->
				<div class="footer mt-4">
					<button class="btn-text" disabled={isActivating} on:click={prevStep}>Back</button>
					{#if activationStatus === 'success'}
						<button class="btn-primary bg-emerald-600 hover:bg-emerald-500 text-white" on:click={nextStep}>Continue</button>
					{:else}
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
								Continue with Free Version
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- =================================================== -->
	<!-- STEP 6: READY TO ROCK SUMMARY LANDING              -->
	<!-- =================================================== -->
	<div class="view-slide" 
		class:translate-x-full={step < 7} 
		class:translate-x-0={step == 7}>
		<div class="page">
			<!-- Left Side: Theme Background Payoff Visual -->
			<div class="sidebar relative overflow-hidden flex flex-col justify-between h-full select-none
				{activationStatus === 'success' 
					? 'bg-gradient-to-b from-amber-950 via-zinc-950 to-zinc-950' 
					: 'bg-gradient-to-b from-indigo-950 via-zinc-950 to-zinc-950'}"
			>
				<div class="space-y-4 p-8 pb-0 relative z-10">
					<i class="fa-solid fa-guitar text-4xl {activationStatus === 'success' ? 'text-amber-400' : 'text-indigo-400'} animate-pulse"></i>
					<div class="space-y-1">
						<h2 class="text-xl font-bold tracking-tight">You're Set!</h2>
						<p class="text-xs text-zinc-400 leading-normal">
							Your personalized environment configuration engine is fully loaded.
						</p>
					</div>
				</div>

				<!-- Soft Background Vinyl Graphics Anchor -->
				<div class="absolute -bottom-14 -left-14 opacity-15 pointer-events-none w-56 h-56 rounded-full border-[12px] border-white flex items-center justify-center">
					<div class="w-24 h-24 rounded-full border-4 border-white"></div>
				</div>
			</div>

			<!-- Right Side: Content Details & App Launch Actions -->
			<div class="main-content flex flex-col justify-between overflow-y-auto custom-scrollbar">
				<div class="w-full space-y-6 text-left my-auto max-w-md mx-auto px-2">
					<div class="space-y-2 text-center sm:text-left">
						<h3 class="text-3xl font-black text-white tracking-tight">Ready for Playback.</h3>
						<p class="text-sm text-zinc-400 leading-relaxed">
							Your music database has been initialized, appearance setups mapped, and preferences locked in natively.
						</p>
					</div>

					<!-- Environment Build Diagnostic Receipt -->
					<div class="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 space-y-3 shadow-inner">
						<h4 class="text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800/60 pb-1.5 flex justify-between">
							<span>Profile Manifest</span>
							<span class="font-mono lowercase text-zinc-600">active_build.json</span>
						</h4>

						<div class="space-y-2 text-xs">
							<!-- Diagnostic 1: Folder Source -->
							<div class="flex items-center justify-between">
								<span class="text-zinc-400 flex items-center gap-1.5"><i class="fa-solid fa-folder text-zinc-600 text-[10px]"></i> Library Directory</span>
								<span class="text-zinc-300 font-mono truncate max-w-[200px]" title={selectedPath}>{selectedPath}</span>
							</div>

							<!-- Diagnostic 2: Account Version Status -->
							<div class="flex items-center justify-between">
								<span class="text-zinc-400 flex items-center gap-1.5"><i class="fa-solid fa-shield-halved text-zinc-600 text-[10px]"></i> License Class</span>
								{#if activationStatus === 'success'}
									<span class="text-amber-400 font-bold flex items-center gap-1"><i class="fa-solid fa-crown text-[10px]"></i> Premium Pro</span>
								{:else}
									<span class="text-zinc-500 font-medium">Standard Free Edition</span>
								{/if}
							</div>

							<!-- Diagnostic 3: Theme State -->
							<div class="flex items-center justify-between">
								<span class="text-zinc-400 flex items-center gap-1.5"><i class="fa-solid fa-palette text-zinc-600 text-[10px]"></i> Interface Skin</span>
								<span class="text-zinc-300 capitalize">{$isDark ? 'Dark' : 'Light'}</span>
							</div>

							<!-- Diagnostic 4: Network Remote State -->
							<div class="flex items-center justify-between">
								<span class="text-zinc-400 flex items-center gap-1.5"><i class="fa-solid fa-network-wired text-zinc-600 text-[10px]"></i> Remote Control Server</span>
								<span class={remoteEnabled ? 'text-purple-400 font-semibold' : 'text-zinc-500'}>
									{remoteEnabled ? 'Online (NSD)' : 'Disabled'}
								</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Launcher Execution Call-to-Action Footer -->
				<div class="footer mt-auto border-t border-zinc-800/30 pt-4 flex justify-between items-center">
					<button class="btn-text" on:click={prevStep}>Back</button>
					<button 
						class="btn-primary px-6 py-2.5 font-bold tracking-wide relative group overflow-hidden shadow-lg"
						class:bg-amber-500={activationStatus === 'success'}
						class:text-zinc-950={activationStatus === 'success'}
						class:hover:bg-amber-400={activationStatus === 'success'}
						class:bg-indigo-600={activationStatus !== 'success'}
						class:text-white={activationStatus !== 'success'}
						class:hover:bg-indigo-500={activationStatus !== 'success'}
						on:click={completeOnboarding}
					>
						Launch Player <i class="fa-solid fa-play ml-2 text-xs transition-transform group-hover:translate-x-0.5"></i>
					</button>
				</div>
			</div>
		</div>
	</div>
	
</div>

<style>

@reference "./assets/main.css";

/* Slide Positioning Details */
.view-slide {
	@apply absolute inset-0 transition-transform duration-300 ease-in-out flex items-center justify-center min-h-0 min-w-0;
}

.view-slide .page {
	/* Mobile-first fallback: fills 100% of the viewport and drops rounded corners/borders */
	@apply flex w-full h-full bg-zinc-900 overflow-hidden min-w-0 min-h-0;

	/* Desktop override: Triggers when the window width is >= 768px (or your chosen threshold) */
	@apply md:w-[80%] md:h-[80%] md:rounded-2xl md:border md:border-zinc-800 md:shadow-2xl;
}

/* Column Divisions */
.sidebar {
	@apply w-1/3 flex flex-col justify-between p-8 border-r border-zinc-800/60 select-none text-left;
}

.main-content {
	@apply flex-1 flex flex-col justify-between p-8 bg-zinc-900/60 relative min-w-0;
}

.footer {
	@apply flex justify-between items-center w-full mt-auto pt-4;
}

/* Atomic UI Elements styled with Tailwind utility classes */
.btn-primary {
	@apply px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center justify-center;
}

.btn-secondary {
	@apply px-3 py-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 border border-zinc-700 rounded-lg text-sm transition flex items-center justify-center;
}

.btn-text {
	@apply text-zinc-400 hover:text-zinc-200 text-sm font-medium transition px-2 py-1;
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

/* Clean subtle layout scrollbar mapping for smaller window sizes */
.custom-scrollbar::-webkit-scrollbar {
	width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	@apply bg-zinc-800 rounded-full hover:bg-zinc-700;
}

button.theme {
	@apply p-4 rounded-xl border flex flex-col items-center gap-3 transition text-center;
}

button.theme.selected {
	@apply border-indigo-500 bg-indigo-950/20;
}

button.theme.notselected {
	@apply border-zinc-800 bg-zinc-950/40 hover:border-zinc-700;
}

@media (max-width: 1050px) {
	.view-slide .page {
		width: 100% !important;
		height: 100% !important;
		border: none !important;
		border-radius: 0px !important;
	}
}

</style>