import { app, ipcMain } from 'electron';
import electronUpdater from 'electron-updater';

const { autoUpdater } = electronUpdater;

export function initUpdater(handler) {
	if (!app.isPackaged) {
		console.log('[UPDATER] Disabled in development');
		return;
	}

	autoUpdater.autoDownload = true;
	autoUpdater.autoInstallOnAppQuit = true;

	ipcMain.on('update:install', () => {
		autoUpdater.quitAndInstall();
	});

	autoUpdater.on('checking-for-update', () => {
		console.log('[UPDATER] Checking for updates...');
	});

	autoUpdater.on('update-available', (info) => {
		console.log('[UPDATER] Update available:', info.version);

		handler('update-available', { version: info.version });
	});

	autoUpdater.on('update-not-available', (info) => {
		console.log('[UPDATER] No update available:', info.version);
	});

	autoUpdater.on('download-progress', (progress) => {
		//console.log(`[UPDATER] Downloading: ${progress.percent.toFixed(1)}%`);

		handler('update-progress', { percent: progress.percent });
	});

	autoUpdater.on('update-downloaded', (info) => {
		console.log('[UPDATER] Update downloaded:', info.version);

		handler('update-downloaded', { version: info.version });
	});

	autoUpdater.on('error', (error) => {
		console.error('[UPDATER] Error:', error);
	});

	autoUpdater.channel = getUpdateChannel();

	console.log('[UPDATER] Version:', app.getVersion());
	console.log('[UPDATER] Platform:', process.platform);
	console.log('[UPDATER] Architecture:', process.arch);
	console.log('[UPDATER] Channel:', autoUpdater.channel);

	autoUpdater.checkForUpdates();
}

function getUpdateChannel() {
	return `latest-${process.arch}`;
}