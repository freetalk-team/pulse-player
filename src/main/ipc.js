
import { dialog, ipcMain } from 'electron';

// import loudness from 'loudness';

import store from './store';

import lib from './services/library';
import radio from './services/radio';
import remote from './services/remote';
import comp from './services/component';
import discovery from './services/discovery';

import { setupIpcHandlers as setupScannerIpcHandlers } from './scanner';

export function setupIpcHandlers(handler) {

	setupScannerIpcHandlers(handler);

	lib.registerHandlers(ipcMain);
	remote.registerHandlers(ipcMain);
	radio.registerHandlers(ipcMain);
	comp.registerHandlers(ipcMain);
	discovery.registerHandlers(ipcMain);

	// File open
	ipcMain.handle('dialog:open-directory', async (event, defaultPath) => {
		// Note: Only macOS ✅ supports both (files and dirs)

		if (!defaultPath || defaultPath == 'Music')
			defaultPath = store.musicDir;

		const { canceled, filePaths } = await dialog.showOpenDialog({
			title: 'Select audio folders',
			//properties: ['openFile', 'openDirectory', 'multiSelections']
			properties: ['openDirectory', 'multiSelections'],
			defaultPath
		});
		
		if (canceled) 
			return null;

		return filePaths; // These are absolute paths!
	});

	ipcMain.handle('dialog:open-file', async (event, defaultPath) => {

		if (!defaultPath || defaultPath == 'Music')
			defaultPath = store.musicDir;

		const { canceled, filePaths } = await dialog.showOpenDialog({
			title: 'Select audio files',
			properties: ['openFile', 'multiSelections'],
			defaultPath
		});
		
		if (canceled) 
			return null;

		return filePaths; // These are absolute paths!
	});

	
	// // Set System Volume (0-100)
	// ipcMain.on('volume:set', async (event, value) => {
	// 	try {
	// 	await loudness.setVolume(value);
	// 	} catch (err) {
	// 	console.error('PulseAudio Error:', err);
	// 	}
	// });

	// // Get current System Volume on start
	// ipcMain.handle('volume:get', async () => {
	// 	try {
	// 	return await loudness.getVolume();
	// 	} catch (err) {
	// 	return 50; // Fallback
	// 	}
	// });

	
}

