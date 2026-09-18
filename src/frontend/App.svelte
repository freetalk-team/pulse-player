<script>

import { onMount } from 'svelte';

import { sleep } from './utils/sleep';

import { pause, initPlayer } from './stores/play';
import { initLayout, isAppReady, isHidden, loadingMessage, currentLayout, modalConfig, isDark } from './stores/ui';
import { clearSelection, isTheaterMode } from './stores/selection';
import { loadLibrary } from './stores/library';

import { closeContextMenu } from './components/ui/ContextMenu.svelte';
import Titlebar from './components/Titlebar.svelte';
import Navbar from './components/Navbar.svelte';
import Sidebar from './components/Sidebar.svelte';
import Header from './components/Header.svelte';
import HeaderCompact from './components/HeaderCompact.svelte';
import Main from './components/Main.svelte';
import Rightbar from './components/Rightbar.svelte';
import Modal from './components/Modal.svelte';
import LoadingSplash from './components/LoadingSplash.svelte';
import VideoElement from './components/ui/Video.svelte';
import Toast, { triggerToast } from './components/ui/Toast.svelte';
import Onboarding from './Onboarding.svelte';

let sidebarWidth = 300;
let rightbarWidth = 240;
let onboardingCompleted = true;
let isMobile = false;
let isDragging = false;
let dragCounter = 0;
let droppedPaths = []; // Temporary storage to pass to Scanne

// Reactive widths: if Theater Mode is ON, force widths to 0
$: currentSidebarWidth = ($isTheaterMode || $currentLayout === 'home') ? 0 : sidebarWidth;
$: currentRightbarWidth = $isTheaterMode ? 0 : rightbarWidth;

window.report = {
	success(msg) { triggerToast(msg); },
	error(msg)   { triggerToast(msg, 'error'); }
};


api.on('error', msg => triggerToast(msg, 'error'));
	

function onKeyDown(e) {
	if (e.key === 'Alt') {
		e.preventDefault();
	}
	else if (e.key === 'Escape') {
		closeContextMenu();
		clearSelection();
	}
}

function onWheel() {
	closeContextMenu();
}

onMount(async () => {

	let loading = true;

	loadingMessage.set('Loading Preferences...');

	await loadPreferences();

	await Promise.all([
		initPlayer(),
		initLayout(),
		sleep(800)
	]);

	loadingMessage.set('Fetching Library...');

	await loadLibrary();

	const unsubscribeTheme = isDark.subscribe(dark => {
		if (loading) return;

		document.documentElement.classList.toggle('light-theme', !dark);
		api.setPref('ui.theme', dark ? 'dark' : 'light');
	});

	loading = false;

	if (isElectron) {
		api.on('power-event', (event, type) => {
			
			if (type === 'pause') {
				pause();
			}
			
			if (type === 'low-power') {
				console.log('Energy saver: Reducing visualizer detail...');
				// You could reduce FFT size here if needed
			}
		});
	}

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			console.debug('On hidden');
			// Optional: reduce visualizer FPS instead of pausing music
		}

		isHidden.update(v => !v);
	});

	isAppReady.set(true);

	const mediaQuery = window.matchMedia('(max-width: 768px)');

	const update = () => {
		isMobile = mediaQuery.matches;
	};

	update();
	mediaQuery.addEventListener('change', update);

	return () => {
		unsubscribeTheme();
		mediaQuery.removeEventListener('change', update);
	};
});

async function loadPreferences() {
	const prefs = await api.getPrefs();
	if (prefs?.ui) {
		sidebarWidth = prefs.ui.sidebarWidth ?? 300;
		rightbarWidth = prefs.ui.rightbarWidth ?? 240;
		// Update any other local variables

		const dark = prefs.ui.theme !== 'light';
		document.documentElement.classList.toggle('light-theme', !dark);

		isDark.set(dark);
	}

	onboardingCompleted = !prefs?.isFirstRun;
}

function handleDragEnter(e) {
	//if (!isElectron) return;

	// 1. If it's our internal track, ignore it immediately
	// if (e.dataTransfer.types.includes('pulse/track')) return;
	if (e.dataTransfer.types.includes('pulse/tracks')) return;

	// 2. Only show the overlay if it's strictly external files
	if (!e.dataTransfer.types.includes('Files')) return;

	e.preventDefault();
	dragCounter++;
	isDragging = true;
}

function handleDragLeave(e) {
	e.preventDefault();
	dragCounter--;
	if (dragCounter === 0) isDragging = false;
}

async function handleDrop(e) {
	//if (!isElectron) return;
	if (!e.dataTransfer.types.includes('Files')) return;

	console.debug('Drop event:', e.dataTransfer.types);
	
	e.preventDefault();
	isDragging = false;
	dragCounter = 0;

	const files = Array.from(e.dataTransfer.files);
	// Use the new webUtils from your preload
	droppedPaths = files.map(f => api.getPathForFile(f));
	
	console.debug('Droped:', droppedPaths);
	
	api.scanFolders(droppedPaths);
}

</script>

<svelte:window 
	on:keydown={onKeyDown}
	on:wheel={onWheel}
/>

<VideoElement />
<Toast />

<!-- 1. Wrap the entire app in a flex-col container -->
<div
	role="application"
	on:dragenter={handleDragEnter}
	on:dragleave={handleDragLeave}
	on:dragover|preventDefault
	on:drop={handleDrop}
	class="flex flex-col w-screen h-screen overflow-hidden select-none"
>
	{#if $modalConfig}
		<Modal 
			{...$modalConfig} 
			on:confirm={$modalConfig.onConfirm} 
			on:close={$modalConfig.onClose} 
		/>
	{/if}

	{#if isDragging}
		<div class="absolute inset-0 z-60 pointer-events-none flex items-center justify-center bg-pulse-blue/20 backdrop-blur-sm pointer-events-none">
			<div class="p-8 border-2 border-dashed border-white/50 rounded-2xl bg-black/60 scale-110 transition-transform">
				<p class="text-xl font-bold">Drop media to import</p>
			</div>
		</div>
	{/if}

	<!-- 2. Add Titlebar at the very top -->
	{#if !isMobile}
		<Titlebar {isDark} />
	{/if}

	<!-- 3. Your existing layout now sits below the Titlebar -->
	<div class="flex flex-grow min-h-0 overflow-hidden">

		{#if $isAppReady}

			{#if !onboardingCompleted}

				<Onboarding bind:complete={onboardingCompleted} />

			{:else}
		
				{#if !isMobile}
					<Navbar />
					
					<Sidebar
						bind:droppedPaths
						width={currentSidebarWidth}
					/>
				{/if}

				<section 
					class="flex-grow flex flex-col min-w-0"
					class:ml-1={!isMobile}
				>
					{#if isMobile}
						<HeaderCompact />
					{:else}	
						<Header />
					{/if}
					
					<div class="flex flex-grow min-h-0">
						<Main />

						{#if !isMobile}
							<Rightbar 
								width={currentRightbarWidth} 
							/>
						{/if}
					</div>
				</section>
			{/if}
		{:else}
			<LoadingSplash message={$loadingMessage} />
		{/if}
	</div>

</div>

<style>

/* Ensure the app root and its direct children always respect the window height */
:global(html, body, #app) {
	height: 100%;
	overflow: hidden;
}

:global(.flex-grow) {
	min-height: 0; /* This allows flex children to scroll instead of expanding */
}

</style>