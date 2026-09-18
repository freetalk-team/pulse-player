
import crypto from 'node:crypto';
import os from 'node:os'
import fs from 'node:fs'
import { join, parse } from 'node:path'

import { ipcMain, app } from 'electron'
import Store from 'electron-store'

import pkg from '../../package.json'

const isProd = app.isPackaged;

const LICENSE_PUB_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAgCEyhuuou7pMmzssdvWNhTRnJHy/3tMmBv+AWXOAHTI=
-----END PUBLIC KEY-----`;

const FEATURES = [
	{
		id: 'TAG_METADATA',
		name: 'Advanced Metadata Toolkit',
		description: 'Automatically fetch track meta info from online databases and write tag edits directly back to your track files.',
		icon: 'fa-tags'
	},
	{
		id: 'REMOTE_DOWNLOAD',
		name: 'Remote Offline Sync',
		description: 'Download remote albums and curated playlists over your local network to store them directly on your device.',
		icon: 'fa-cloud-arrow-down'
	},
	{
		id: 'STREAM_RECORD',
		name: 'Stream Recorder',
		description: 'Record online radio stations in real-time, slicing incoming live streams into perfectly labeled audio files.',
		icon: 'fa-radio'
	}
];

const REGISTER_URL = import.meta.env.VITE_REGISTER_URL;
const ACTIVATE_URL = import.meta.env.VITE_ACTIVATE_URL;

class Storage extends Store {

	#id;
	#isFirstRun = false;
	#appRoot;
	#thumbDir;
	#features = new Set;
	#changeListeners = new Map;

	get appRoot() { return this.#appRoot; }

	get isFirstRun() { return this.#isFirstRun; }

	get id() { return this.#id; }
	get uid() { return this.#id.hashCode(); }
	get remote() { return this.get('remote'); }
	get hostname() { return os.hostname() || 'Desktop Station'; }
	get platform() { return os.platform(); }
	get version() { return pkg.version; }
	get website() { return pkg.homepage; }
	get appName() { return pkg.appname; }
	get nsd() { return pkg.nsd; }
	get port() { return this.get('port', pkg.config.port); }
	get activationUrl() { return ACTIVATE_URL; }
	// get licenseKey() { return LICENSE_PUB_KEY; }

	get thumbDir() { return this.#thumbDir; }
	get thumbRadioDir() { return join(this.#thumbDir, 'radio'); }
	get imageCacheDir() { return join(this.#appRoot, 'image-cache'); }
	get databaseDir() { return join(this.#appRoot, 'db'); }
	get musicDir() { return app.getPath('music'); }
	get videoDir() { return app.getPath('videos'); }

	constructor(root=app.getPath('userData')) {
		super();

		console.debug('STORE:', this.store);
		// this.clear();

		this.#appRoot = root;
		this.#thumbDir = join(root, 'thumbnails');

		const checkDirs = [this.databaseDir, this.thumbRadioDir, this.imageCacheDir];

		for (const dir of checkDirs) {
			fs.mkdirSync(dir, { recursive: true });
		}

		let id = this.get('instanceId');

		if (!id) {
			
			id = crypto.randomUUID();

			this.#setup(id);
			this.#register(id);

			this.#isFirstRun = true;
		}
		else {
			const license = this.get('license');
			if (license) {
				if (verifyLicense(license)) {
					console.debug('License verified:', license.features);

					this.#features = new Set(license.features);
				}
				else {
					console.error('License verification failed');
				}
			}
		}

		this.#id = id;
		this.#registerHandlers();
	}

	registerListener(key, listener) {
		const listeners = this.#changeListeners.get(key);
		if (listeners)
			listeners.add(listener);
		else
			this.#changeListeners.set(key, new Set([listener]));

		return this.get(key);
	}

	thumbRelativePath(path) {
		return path.startsWith(this.#thumbDir)
			? path.slice(this.#thumbDir.length + 1)
			: path;
	}

	getDatabaseVersion(name, ver=1) { 
		return this.get(databaseKey(name), ver);
	}

	setDatabaseVersion(name, version) {
		this.set(databaseKey(name), version);
	}

	hasFeature(feature) {
		return this.#features.has(feature);
	}

	#setup(id) {
		const prefs = {
			instanceId: id
		};

		this.#setupUI(prefs);
		this.#setupPlayer(prefs);
		this.#setupRemote(prefs);
		this.#setupRadio(prefs);
		this.#setupDirs(prefs);

		this.set(prefs);
	}

	#setupRemote(prefs) {
		prefs.remote = {
			name: `Pulse Player (${this.hostname})`,
			username: getUsername(),
			icon: 'fa-computer accent'
		};
	}

	#setupPlayer(prefs) {
		prefs.player = {
			volume: 25,
			queueMode: false,
			videoMode: true,
			shuffleMode: false,
			repeatMode: false
		};
	}

	#setupRadio(prefs) {
		prefs.radio = {
			api: 'radio-browser', // ['radio-browser', 'sipme']
			addThumb: true
		};
	}

	#setupUI(prefs) {
		prefs.ui = {
			sidebarWidth: 300,
			rightbarWidth: 240,
			workbenchCollapsed: false
		};
	}

	#setupDirs(prefs) {
		const musicDir = this.musicDir;
		const videoDir = this.videoDir;

		const dirs = {
			music: musicDir,
			video: videoDir,

			album: {
				rootDir: musicDir,
				subdirPattern: '[ARTIST]/[ALBUM]',
				filenamePattern: '[INDEX] - [TITLE]',
				skipOptions: false,
				overwrite: 'skip'
			},

			playlist: {
				rootDir: musicDir,
				subdirPattern: '[GENRE]',
				filenamePattern: '[ARTIST] - [TITLE]',
				skipOptions: false,
				overwrite: 'skip'
			},

			track: {
				rootDir: musicDir,
				subdirPattern: '[GENRE]',
				filenamePattern: '[ARTIST] - [TITLE]',
				skipOptions: false,
				overwrite: 'skip'
			},

			recording: {
				rootDir: join(musicDir, 'Recordings'),
				subdirPattern: '',
				filenamePattern: '[STATION] [TIME]',
				skipOptions: false,
				addToPlaylist: true,
			}
		};

		prefs.dir = dirs;
	}

	#set(key, value) {
		this.set(key, value);

		const emitChange = (k, v) => {
			const listeners = this.#changeListeners.get(key);
			if (listeners) {
				for (const listener of listeners)
					listener.onPrefChange(key, value);
			}
		};

		if (typeof key == 'string') {
			emitChange(key, value);
		}
		else {
			for (const [k, v] of Object.entries(key))
				emitChange(k, v);
		}
	}

	#registerHandlers() {
		ipcMain.handle('get-prefs', () => this.#getPrefs()); 
		ipcMain.handle('set-pref', (event, key, value) => {
			console.debug('[PREF]', key, value);
			this.#set(key, value);
		});

		ipcMain.handle('activate-pro', async (event, code) => {
			try {
				// 1. Send the POST request natively from the node main thread
				const response = await fetch(this.activationUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ 
						token: code,
						installationId: this.id,
						hostname: this.hostname,
						platform: this.platform,
						version: this.version
					})
				});

				const data = await response.json();

				console.debug('[ACTIVATION] response:', data);

				if (response.ok && data.success) {
					// 2. Commit directly to disk safely inside the main process
					// store.set('license', {
					// 	key: activationKey,
					// 	active: true,
					// 	features: data.features || [],
					// 	activatedAt: new Date().toISOString()
					// });

					const license = data.license;

					this.set('license', license);
					this.#features = new Set(license.features);


					// Return success data back to Svelte
					return { success: true, features: license.features };
				} else {
					return { success: false, message: data.message || "Invalid license key definition." };
				}
			} catch (error) {
				return { success: false, message: "Could not establish connection to the activation server." };
			}
		});

		ipcMain.handle('get-features', () => {
			const features = [...FEATURES];
			for (const i of features)
				i.enabled = this.#features.has(i.id);

			//console.debug('Features:', features);

			return features;
		});
	}

	#getPrefs() {
		const prefs = this.store;
		const isFirstRun = this.#isFirstRun;

		this.#isFirstRun = false;
		
		const dbEntries = fs.readdirSync(this.databaseDir, { withFileTypes: true });
		for (const e of dbEntries) {
			if (!e.isFile()) continue;
				
			const { name, ext } = parse(e.name);
			if (ext != '.db') continue;

			if (prefs.db[name]) {
				const stat = fs.statSync(join(e.parentPath, e.name));

				prefs.db[name] = {
					version: prefs.db[name],
					size: stat.size
				};
			}
		}

		Object.assign(prefs, {
			features: [...this.#features.keys()],
			uid: this.uid,
			isFirstRun
		});

		return prefs;
	}

	async #register(id) {
		try {
			const res = await fetch(REGISTER_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					instanceId: id,
					hostname: this.hostname,
					platform: this.platform,
					version: this.version
				})
			});

			if (res.ok)
				this.set('registered', true);
		}
		catch (e) {
			console.error('Failed to register:', e.message);
		}
	}
}

function databaseKey(name) {
	return `db.${name}`;
}

function getUsername() {
	const username = os.userInfo().username;

	if (process.platform === 'linux') {

		const passwd = fs.readFileSync('/etc/passwd', 'utf8');

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

function verifyLicense(license) {
    if (!license?.signature)
        return false;

    const { signature, ...data } = license;

    return crypto.verify(
        null,
        Buffer.from(JSON.stringify(data)),
        LICENSE_PUB_KEY,
        Buffer.from(signature, 'base64')
    );
}

const store = new Storage;



// store.clear();



export default store;
