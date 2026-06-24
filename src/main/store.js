
import crypto from 'node:crypto';
import os from 'node:os'
import fs from 'node:fs'
import { join } from 'node:path'

import { ipcMain, app } from 'electron'
import Store from 'electron-store'

import pkg from '../../package.json'

const userData = app.getPath('userData');
const THUMB_DIR = join(userData, 'thumbnails');

if (!fs.existsSync(THUMB_DIR)) 
	fs.mkdirSync(THUMB_DIR);

class AppStore extends Store {

	#id;
	#isFirstRun = false;

	get isFirstRun() { return this.#isFirstRun; }

	get id() { return this.#id; }
	get name() { return this.get('instanceName'); }
	get version() { return pkg.version; }
	get website() { return pkg.homepage; }
	get port() { return this.get('port', pkg.config.port); }

	get thumbDir() { return THUMB_DIR; }

	constructor() {
		super();

		let id = this.get('instanceId');

		if (!id) {
			id = crypto.randomUUID();

			this.set('instanceId', id);
			this.set('instanceName', `Pulse Player (${os.hostname()})`);
			this.set('username', getUsername());

			this.#isFirstRun = true;
		}
		
		this.#id = id;

		ipcMain.handle('get-prefs', () => this.store); // Returns all settings
		ipcMain.handle('set-pref', (event, key, value) => {

			console.debug('[PREF]', key, value);

			if (typeof key == 'string') {
				this.set(key, value)
			}
			else {
				for (const [k, v] of Object.entries(key))
					this.set(k, v);
			}
		});

		ipcMain.handle('get-custom-genres', () => this.get('customGenres', [])); 


		// 2. Save a new custom genre to the JSON config
		ipcMain.handle('save-custom-genre', (event, newGenre) => {
			const existing = this.get('customGenres', []);
			if (!existing.includes(newGenre)) {
				const updated = [...existing, newGenre];
				this.set('customGenres', updated);
				return updated;
			}
			return existing;
		});
	}

	
}

function getUsername() {
	const username = os.userInfo().username;
	const passwd = fs.readFileSync('/etc/passwd', 'utf8');

	if (process.platform === 'linux') {

		const line = passwd
			.split('\n')
			.find(l => l.startsWith(username + ':'));

		if (line) {

			const parts = line.split(':');

			// GECOS field
			const fullName = parts[4].split(',')[0];

			//console.log(fullName);

			return fullName;
		}
	}

	return username;
}

const store = new AppStore;



// store.clear();



export default store;
