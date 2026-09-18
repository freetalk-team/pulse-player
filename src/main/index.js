

import 'source-map-support/register'

import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

import Help from './help.txt?raw'

import '../common/string'
import '../common/date'
import '../common/object'

import { registerProtocols } from './protocol.js'

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

// async function bootstrap() {

// 	const isHeadless = cmd == 'headless';

// 	if (!isHeadless) {
// 		configureElectron();
// 		registerProtocols();
// 	}

// 	await app.whenReady();

// 	if (isHeadless) {
// 		const { startHeadless } = await import('./headless.js');
// 		await startHeadless();
// 	}

// 	else {
// 		const { startApp } = await import('./app.js');
// 		await startApp();
// 	}
// }

function configureElectron() {
    if (process.argv.includes('--vm')) {
		console.log('VM mode!');

        app.disableHardwareAcceleration();

        app.commandLine.appendSwitch('disable-features', 'VaapiVideoDecoder,UseOzonePlatform' );
        app.commandLine.appendSwitch('disable-gpu');
        app.commandLine.appendSwitch('disable-software-rasterizer');
    }
    else {
        app.commandLine.appendSwitch('disable-features', 'AudioServiceOutOfProcess');
        app.commandLine.appendSwitch('ignore-gpu-blocklist');
        app.commandLine.appendSwitch('enable-gpu-rasterization');
        app.commandLine.appendSwitch('enable-zero-copy');
    }
}

function getCliCommand() {
	// return { command: 'headless'};
	// return { command: 'import', args: ['/home/pat/Music/albums'] };
	// return { command: 'help' };

	const [command, ...args] = process.argv.slice(1);

	switch (command) {
		case 'help':
		case '--help':
		case '-h':
			return {
				command: 'help',
				args
			};

		case 'headless':
			return {
				command: 'headless',
				args
			};

		case 'import':
			return {
				command: 'import',
				args
			};

		default:
			return {
				command: null,
				args: []
			};
	}
}

function showHelp() {
	process.stdout.write(Help);
	process.exit(0);
}

async function startServer() {
	await app.whenReady();

	const { startHeadless } = await import('./headless.js');

	await startHeadless();
}

async function startDesktop() {
	configureElectron();
	registerProtocols();

	await app.whenReady();

	const { startApp } = await import('./app.js');

	await startApp();
}

async function startImport(paths) {
	const { importPaths } = await import('./import.js');

	await importPaths(paths);

	process.exit(0);
}

const { command, args } = getCliCommand();

switch (command) {
	case 'help':
	showHelp();
	break;

	case 'headless':
	startServer();
	break;

	case 'import':
	startImport(args);
	break;

	default:
	startDesktop();
}
