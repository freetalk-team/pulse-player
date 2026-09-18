import { writable, get } from 'svelte/store';

import { sleep } from '../utils/sleep';

import { pause, volume } from './play';

export const isLoading = writable(false);
export const isAppReady = writable(false);
export const loadingMessage = writable('Initializing Pulse Engine...');
export const isHidden = writable(false);

export const isDark = writable(true);
export const modalConfig = writable(null);
export const contextMenu = writable(null);
export const renamingId = writable(null);
export const currentLayout = writable('home');
export const homeEditPlaylist = writable(null);
export const homeActiveTab = writable('all');
export const sleepTimer = writable(null); // Minutes remaining or null

let isInitialized = false;
let sleepInterval;

currentLayout.subscribe(val => {
	if (!isInitialized) return;

	if (val !== 'settings')
		api.setPref('ui.lastLayout', val);
});

export async function initLayout() {
	const prefs = api.getPref('ui');

	if (prefs?.lastLayout) 
		currentLayout.set(prefs.lastLayout);

	isInitialized = true;
}

export function confirmAction(config) {
	return new Promise((resolve) => {
		modalConfig.set({
			...config,
			onConfirm: () => {
				modalConfig.set(null);
				resolve(config.options || true);
			},
			onClose: () => {
				modalConfig.set(null);
				resolve(false);
			}
		});
	});
}

export function closeContextMenu() {

	const closeMenu = get(contextMenu);
	if (closeMenu) {
		closeMenu();
		contextMenu.set(null);

		return true;
	}

	return false;
}

export function setSleepTimer(minutes) {
	if (sleepInterval) clearInterval(sleepInterval);
	
	if (minutes === null) {
		sleepTimer.set(null);
		return;
	}

	sleepTimer.set(minutes);
	
	sleepInterval = setInterval(() => {
		sleepTimer.update(n => {
			if (n <= 1) {
				finishSleep();
				return null;
			}
			return n - 1;
		});
	}, 60000); // Update every minute
}

async function finishSleep() {
	clearInterval(sleepInterval);
	
	// Optional: Fade out volume over 10 seconds
	const startVol = get(volume);
	for (let i = 0; i <= 10; i++) {
		volume.set(startVol * (1 - i / 10));
		await sleep(1000);
	}
	
	pause(); // Pause
	volume.set(startVol); // Reset volume for next time
}

// export function toggleTheater() {
//     isTheaterMode.update(v => !v);
// }