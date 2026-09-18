<script>

import { onMount } from 'svelte';

import { sleep } from '@frontend/utils/sleep';
import { isAppReady, loadingMessage } from '@stores/ui';
import { isTheaterMode } from '@stores/selection';
import { initPlayer } from '@stores/play';

import Toast, { triggerToast } from '@components/ui/Toast.svelte';
import LoadingSplash from '@components/LoadingSplash.svelte';
import Header from '@components/Header.svelte';
import Rightbar from '@components/Rightbar.svelte';
import VideoElement from '@components/ui/Video.svelte';
import Titlebar from '@components/Titlebar.svelte';

import Main from './Main.svelte';

let sidebarWidth = 300;
let rightbarWidth = 240;

$: currentRightbarWidth = $isTheaterMode ? 0 : rightbarWidth;

window.report = {
	success(msg) { triggerToast(msg); },
	error(msg)   { triggerToast(msg, 'error'); }
};

onMount(async () => {
	await loadPreferences();

	await Promise.all([
		initPlayer(),
		// initLayout(),
		sleep(800)
	]);

	loadingMessage.set('Fetching Library...');

	isAppReady.set(true);
});

async function loadPreferences() {
	const prefs = await api.getPrefs();
	if (prefs?.ui) {
		sidebarWidth = prefs.ui.sidebarWidth ?? 300;
		rightbarWidth = prefs.ui.rightbarWidth ?? 240;
		// Update any other local variables
	}
}

</script>

<VideoElement />
<Toast />

<div role="application"
	class="flex flex-col w-screen h-screen overflow-hidden select-none"
>

	<!-- 2. Add Titlebar at the very top -->
	<Titlebar />

	<!-- 3. Your existing layout now sits below the Titlebar -->
	<div class="flex flex-grow min-h-0 overflow-hidden">

		{#if $isAppReady}

			<section class="flex-grow flex flex-col min-w-0">
				<Header />
				
				<div class="flex flex-grow min-h-0">
					<Main />
					<Rightbar 
						width={currentRightbarWidth} 
					/>
				</div>
			</section>
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