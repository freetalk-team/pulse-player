
import { Bonjour } from 'bonjour-service';

import store from '../store';
import remote from './remote';

const devFlag = process.argv.includes('--dev');

class Discovery extends Bonjour {

	static instance = new Discovery;

	#service;
	#browser;
	#remotes = new Map;
	#id = store.uid;

	get id() { return this.#id; }
	get name() { return this.#id.toString(16); }
	get remote() { return store.get('remote'); }
	get version() { return store.version; }
	get type() { return store.nsd; }

	getRemote(id) {
		return this.#remotes.get(id);
	}

	onPrefChange(key, value) {
		switch (key) {
			case 'remote':
			this.#updateStatus(value);
			break;
		}
	}

	startServer() {
		const remote = store.registerListener('remote', this);

		this.#publish(remote);
	}

	startClient(handler) {

		this.#browser = this.find({ type: this.type });

		this.#browser.on('up', service => {

			const id = parseInt(service.name, 16);
			const { hostname, username, icon, photo } = service.txt; 

			remote.updateUser(id, username, photo);

			// ingore self
			if (id === this.#id) {

				if (!devFlag)
					return;
			}
			
			console.debug('[DISCOVERY] Found player:', service);

			const [ico, iconColor] = icon.split(' ');

			const player = {
				id,
				host: service.host,
				port: service.port,
				//addresses: service.addresses,
				address: service.referer.address,
				hostname,
				username,
				icon: ico,
				iconColor
			};

			this.#remotes.set(id, player);
			
			handler('add-remote-player', player);
		});
		

		this.#browser.on('down', service => {
			console.debug('[DISCOVERY] Player disappeared:', service.name);

			const id = parseInt(service.name, 16);

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

	
	registerHandlers(ipc) {
		ipc.handle('remote-players', () => [...this.#remotes.values()]);
	}

	#updateStatus(remote) {
		if (!this.#service) return;

		this.#service.stop();
		this.#publish(remote);
	}

	#publish(remote) {

		const name = this.name;
		const port = store.port;

		this.#service = super.publish({
			name,
			type: this.type,
			protocol: 'tcp',
			port,

			txt: {
				version: store.version,
				hostname: remote.name,
				username: remote.username,
				icon: remote.icon
			}
		});

		console.log('[DISCOVERY] server started:', name, port);
	}
}

export default Discovery.instance;
