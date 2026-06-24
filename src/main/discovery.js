
import { ipcMain } from 'electron'
import { Bonjour } from 'bonjour-service';

import store from './store';
import db from './db';

//const type = 'freetalkmusic';
const type = 'pulseplayer';
const devFlag = process.argv.includes('--dev');

class Discovery extends Bonjour {

	#service;
	#browser;
	#remotes = new Map;
	#id = store.id;

	get id() { return this.#id; }

	constructor() {
		super();

		ipcMain.handle('remote-players', () => [...this.#remotes.values()])
	}

	getRemote(id) {
		return this.#remotes.get(id);
	}

	startServer() {

		const name = store.name;
		const port = store.port;

		console.debug('[DISCOVERY] Starting server:', this.#id);

		this.#service = this.publish({
			name,
			type,
			protocol: 'tcp',
			port,

			txt: {
				version: store.version,
				instanceId: this.#id,
				username: store.get('username'),
			}
		});

		console.debug('[DISCOVERY] server started:', name, port);
	}

	startClient(handler) {

		this.#browser = this.find({ type });

		this.#browser.on('up', service => {

			const id = service.txt.instanceId;
			const username = service.txt.username;
			const photo = service.txt.photo;

			db.updateUser(id, username, photo);

			// ingore self
			if (id === this.#id) {

				if (!devFlag)
					return;
			}
			
			console.debug('[DISCOVERY] Found player:', service);

			const remote = {
				id,
				name: service.name,
				host: service.host,
				port: service.port,
				//addresses: service.addresses,
				address: service.referer.address,
				username
			}

			this.#remotes.set(id, remote);
			
			handler('add-remote-player', remote);
		});
		

		this.#browser.on('down', service => {
			console.debug('[DISCOVERY] Player disappeared:', service.name);

			const id = service.txt.instanceId;

			if (id != this.#id) {
				this.#remotes.delete(id);

				handler('remove-remote-player', { id });
			}
		});
	}

	shutdown() {

		return new Promise(resolve => {

			const finish = () => {
				// call it explicitly
				//this.destroy();

				console.log('[DISCOVERY] server stopped');

				resolve();
			};

			if (this.#service) {

				this.#service.stop(() => {

					this.#service = null;

					if (this.#browser) {
						this.#browser.stop();
						this.#browser = null;
					}

					// Give mDNS goodbye packet time to flush
					setTimeout(finish, 500);
				});

			} else {
				finish();
			}
		});
	}
}

const service = new Discovery;

export default service;
