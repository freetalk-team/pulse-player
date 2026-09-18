import { join } from 'path'
import fs from 'fs'
import os from 'node:os'

import { createServer } from './server';

import store from './store';

import radio from './services/radio';
import library from './services/library';
import remote from './services/remote';
import component from './services/component';
import discovery from './services/discovery';

let server;

export async function startHeadless() {

	try {
		library.init();
		radio.init();
		component.init();
		remote.init();

		console.log('Database initialized successfully');
	}
	catch (e) {
		console.error('🚨 Failed to initialize database:', e);
		return;
	}

	try {

		server = await createServer();

	} catch (e) {
		console.error('🚨 Failed to start server:', e);
		return;
	}

	let shuttingDown = false;

	async function shutdown() {
		if (shuttingDown) {
			return;
		}

		shuttingDown = true;

		console.debug('Shutting down...');

		try {
			await server.close();
			await discovery.shutdown();

			discovery.destroy();
			component.destroy();
			library.destroy();
			radio.destroy();
			remote.destroy();
		} catch (error) {
			console.error('Error during shutdown:', error);
		} finally {
			process.exit(0);

			// setTimeout(() => {
			// 	process.exit();
			// }, 1000);
		}
	}

	process.on('SIGINT', shutdown);
}