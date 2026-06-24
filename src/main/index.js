import { app, shell, BrowserWindow, ipcMain, powerMonitor } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import { join } from 'path'
import fs from 'fs'
import os from 'node:os'


import 'source-map-support/register'

import icon from '../../resources/icon.png?asset'

import '../common/string'
import '../common/date'
import '../common/object'

import { registerProtocols, registerProtocolHandlers } from './protocol';
import { setupIpcHandlers } from './ipc';
import { setupEventHandlers } from './events';
import { createServer } from './server';

import store from './store';
import db from './db';
import discovery from './discovery';

import { migrations } from './component';

const appName = 'Pulse Player';

registerProtocols();

// app.commandLine.appendSwitch('enable-overlay-scrollbars');

// 1. Force standard scrollbars instead of overlay ones
//app.commandLine.appendSwitch('disable-features', 'OverlayScrollbar');

// 2. (Optional) Some Linux environments need this specifically
//app.commandLine.appendSwitch('enable-features', 'StandardScrollbars');

// 3. Keep your existing PulseAudio fixes

// Enable hardware acceleration (often needed for 4K/H.265)
if (process.argv.includes('--vm')) {
	app.disableHardwareAcceleration();

	app.commandLine.appendSwitch('disable-features', 'VaapiVideoDecoder,UseOzonePlatform');
	app.commandLine.appendSwitch('disable-gpu');
	app.commandLine.appendSwitch('disable-software-rasterizer');
}
else {

	app.commandLine.appendSwitch('disable-features', 'AudioServiceOutOfProcess');

	app.commandLine.appendSwitch('ignore-gpu-blocklist');
	app.commandLine.appendSwitch('enable-gpu-rasterization');
	app.commandLine.appendSwitch('enable-zero-copy');
}

app.setName(appName);
app.name = appName;

let mainWindow;
let server;
let isShuttingDown = false;

const handler = (event, data) => mainWindow.webContents.send(event, data);

// console.log('📂 Database Location:', app.getPath('userData'));

const appData = app.getPath('userData');
console.log('App data:', appData);

// Store the DB in the user's AppData folder
const dbPath = join(appData, 'library.db');

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
	app.quit();
	process.exit(0);
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Someone tried to run a second instance

		if (mainWindow) {
			// Restore if minimized
			if (mainWindow.isMinimized()) {
				mainWindow.restore();
			}

			// Show if hidden
			if (!mainWindow.isVisible()) {
				mainWindow.show();
			}

			// Bring to front
			mainWindow.focus();

			// Optional: force on top briefly
			mainWindow.setAlwaysOnTop(true);
			mainWindow.setAlwaysOnTop(false);
		}
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

	try {
		db.init(dbPath, migrations);
	}
	catch (e) {
		console.error('🚨 Failed to initialize database:', e);
		return;
	}

	createServer().then(s => {
		server = s

	})

	
	// Set app user model id for windows
	electronApp.setAppUserModelId('io.sipme.pulseplayer')

	// Default open or close DevTools by F12 in development
	// and ignore CommandOrControl + R in production.
	// see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
	app.on('browser-window-created', (_, window) => {
		optimizer.watchWindowShortcuts(window)
	})

	// IPC test
	ipcMain.on('ping', () => console.log('pong'))

	ipcMain.on('window:min', () => mainWindow.minimize());
	ipcMain.on('window:close', () => mainWindow.close());

	ipcMain.on('window:max', () => {
		if (mainWindow.isMaximized()) 
			mainWindow.unmaximize();
		else 
			mainWindow.maximize();
	});

	registerProtocolHandlers();

	createWindow()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})

	setupIpcHandlers(handler);
	setupEventHandlers(handler);

	discovery.startServer();
	discovery.startClient(handler);

	const win = BrowserWindow.getAllWindows()[0];

    // 1. Suspend (Computer goes to sleep)
    powerMonitor.on('suspend', async () => {
        console.debug('[POWER] suspending...');

        handler('power-event', 'pause');

		await discovery.shutdown();
    });

	powerMonitor.on('resume', () => {
        console.debug('[POWER] resumed');

		handler('power-event', 'resume');

  		discovery.startServer();
  		discovery.startClient(handler);
	});

    // 2. Lock Screen (Optional but recommended)
    //powerMonitor.on('lock-screen', () => handler('power-event', 'pause'));

    // 3. Lid Closed (On Linux/Windows if configured)
    powerMonitor.on('on-battery', () => handler('power-event', 'low-power'));
	powerMonitor.on('on-ac', () => handler('power-event', 'ac-power'));


	if (process.argv.includes('--dev')) {
  		win.webContents.openDevTools()
	}

	// globalShortcut.register('Control+Shift+I', () => {
    // 	BrowserWindow.getFocusedWindow()?.webContents.openDevTools()
  	// })
})


app.on('before-quit', async (event) => {

	if (isShuttingDown) {
		return;
	}

	event.preventDefault();

	isShuttingDown = true;

	await discovery.shutdown();

	discovery.destroy();

	app.quit();
});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {

	if (server) {
    	await server.close();
  	}

	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

process.on('uncaughtException', (error) => {

	if (is.dev) {
		// In Dev: Big loud console error for you
		console.error('🚨 Dev Crash:', error.stack)
	} else {
		// In Production: Log to a file so a user can send it to you
		// You can use 'electron-log' for this
		console.error('App Error:', error.message)
	}
	
});

function createWindow() {

	const { width, height } = store.get('windowBounds', { width: 900, height: 670 });
	const isMaximized = store.get('isMaximized', false);

	// Create the browser window.
	mainWindow = new BrowserWindow({
		title: appName,
		width,
		height,
		show: false,
		frame: false,            // 1. Removes the OS title bar and borders
		titleBarStyle: 'hidden', // 2. Essential for macOS support later
		autoHideMenuBar: true,
		backgroundColor: '#00000000', // 4. Supports your transparency
		...(process.platform === 'linux' ? { icon } : {}),
		webPreferences: {
			preload: join(__dirname, '../preload/index.js'),
			sandbox: false,
			contextIsolation: true,
			// webSecurity: false, // Only for testing! If this fixes it, the issue is CSP/Protocol
			plugins: true
		}
	});

	// 2. If it was maximized, restore that state
	if (isMaximized) {
		mainWindow.maximize();
	}

	if (!is.dev) {
		mainWindow.setMenu(null);
	}

	mainWindow.on('ready-to-show', () => {
		mainWindow.show()
	})

	let saveTimeout;

	const saveState = () => {
		// Clear the previous timer every time the window moves/resizes
		clearTimeout(saveTimeout);

		// Set a new timer
		saveTimeout = setTimeout(() => {
			console.log('Saving window state to disk...');
			if (!mainWindow.isMaximized()) {
				store.set('windowBounds', mainWindow.getBounds());
			}
			store.set('isMaximized', mainWindow.isMaximized());
		}, 500); // Wait 500ms after the last event
	}

    mainWindow.on('resize', saveState);
    mainWindow.on('move', saveState);
	mainWindow.on('maximize', () => store.set('isMaximized', true));
	mainWindow.on('unmaximize', () => store.set('isMaximized', false));


	mainWindow.webContents.setWindowOpenHandler((details) => {
		shell.openExternal(details.url)
		return { action: 'deny' }
	})

	// HMR for renderer base on electron-vite cli.
	// Load the remote URL for development or the local html file for production.
	if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
		mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
	} else {
		mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
	}

	// mainWindow.webContents.on('did-finish-load', () => {
	//   mainWindow.webContents.insertCSS(`
	//     ::-webkit-scrollbar-button {
	//       display: none!important;
	//       width: 0!important;
	//       height: 0!important;
	//     }
	//   `);
	// });

}