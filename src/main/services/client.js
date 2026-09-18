
import discovery from './discovery';

import { events } from '../events';

const DESTROY_TIMEOUT = 60 * 1000;

WebSocket.prototype.sendMessage = function(type, payload) {
	this.sendTextMessage(JSON.stringify({ type, payload }));
}

WebSocket.prototype.sendTextMessage = function(msg) {
	this.send(msg);

	if (!this._isWatching) {
		if (this._destroyTimeout)
			clearTimeout(this._destroyTimeout);

		this._destroyTimeout = setTimeout(() => this.close(), DESTROY_TIMEOUT);
	}
}

class ClientManager {

	static instance = new ClientManager;

	#connections = new Map();
	#clients = new Set();

	addClient(socket) {
		this.#clients.add(socket);

		socket.on('close', () => {
			console.debug('[REMOTE CLIENT] closed:', socket.remoteId);

			// clearInterval(ping);
			this.#clients.delete(socket);
		});
	}

	async broadcast(channel, type, payload, notify=[], origin) {

		console.debug('[BROADCAST]', channel, type, `clients=${this.#clients.size}`);

		const clients = new Set;
		const msg = JSON.stringify({ type, payload });

		for (const socket of this.#clients) {

			if (socket.remoteId == origin) continue;

			clients.add(socket.remoteId);
			socket.send(msg);

			// if (socket.subscriptions?.has(channel)) {

			// 	socket.send(
			// 		JSON.stringify({ type, payload })
			// 	);
			// }
		}

		const peers = notify.filter(i => !clients.has(i));
		for (const remote of peers) {
			try {

				const socket = await this.acquire(remote);

				socket.sendTextMessage(msg);
			}
			catch (e) {
				console.error('[BROADCAST] failed to send to remote:', remote);
			}
		}
	}

	async acquire(remoteId) {

		let socket = this.#connections.get(remoteId);

		// Existing connection

		if (socket) {
			if (socket._destroyTimeout) {
				clearTimeout(socket._destroyTimeout);
				delete socket._destroyTimeout;
			}

			return socket;
		}

		// Create new connection

		socket = await this.#createConnection(remoteId);

		return socket;
	}

	async startWatch(remoteId) {

		console.debug('[CLIENT] Start watching:', remoteId);

		const socket = this.#connections.get(remoteId);

		if (socket) {
			if (socket._destroyTimeout) {
				clearTimeout(socket._destroyTimeout);
				delete socket._destroyTimeout;
			}

			socket._isWatching = true;

			return socket;
		}

		return this.#createConnection(remoteId, true);
	}

	stopWatch(remoteId) {
		const socket = this.#connections.get(remoteId);

		console.debug('[CLIENT] Stop watching:', remoteId);

		if (socket) {
			socket._isWatching = false;
			socket._destroyTimeout = setTimeout(() => socket.close(), DESTROY_TIMEOUT);
		}
	}

	async send(remoteId, type, data = {}) {

		let socket = this.#connections.get(remoteId);

		if (!socket) {

			console.warn('[CLIENT] No connection:', remoteId);

			socket = await this.#createConnection(remoteId);

			if (!socket) {

				return;
			}
		}

		// if (conn.socket.readyState !== WebSocket.OPEN) {
		// 	console.warn('[CLIENT] Socket not open:', remoteId);
		// 	return;
		// }

		socket.sendMessage(type, data);
	}



	isConnected(remoteId) {

		const socket = this.#connections.get(remoteId);

		if (!socket)
			return false;

		return socket.readyState === WebSocket.OPEN;
	}

	getConnection(remoteId) {
		return this.#connections.get(remoteId);
	}

	// ============================================
	// INTERNAL
	// ============================================

	#createConnection(remoteId, watching=false) {

		return new Promise((resolve, reject) => {

			const remote = discovery.getRemote(remoteId);

			if (!remote) {

				reject(
					new Error(`Unknown remote: ${remoteId}`)
				);

				return;
			}

			console.debug(
				'[CLIENT] Connecting:',
				remote.address
			);

			const host = `${remote.address}:${remote.port}`;
			const baseUrl = `http://${host}`

			const socket = new WebSocket(`ws://${host}/ws`);

			socket.remoteId = remoteId;
			socket.baseUrl = baseUrl;
			socket._isWatching = watching;


			const timeout = setTimeout(() => {

				//socket.terminate();
				socket.close();

				reject(
					new Error('Connection timeout')
				);

			}, 5000);

			socket.onopen = () => {

				clearTimeout(timeout);

				// Handshake

				socket.send(JSON.stringify({
					type: 'hello',
					id: discovery.id,
					// name: discovery.name,
					// version: discovery.version
				}));

				this.#connections.set(remoteId, socket);

				console.debug('[CLIENT] Connected:', remoteId, baseUrl, `connections=${this.#connections.size}`);

				resolve(socket);
			};

			socket.onmessage = event => {

				this.#handleMessage(socket, event.data);
			};

			socket.onclose = () => {


				if (socket._destroyTimeout)
					clearTimeout(socket._destroyTimeout);

				this.#connections.delete(remoteId);

				console.debug('[CLIENT] Disconnected:', remoteId, baseUrl, `connections=${this.#connections.size}`);

				events.emit('remote:closed', remoteId);
			};

			socket.onerror = err => {
				console.error('[CLIENT] Socket error:', err.message);
				reject(err);
			};
		});
	}

	

	#handleMessage(socket, raw) {

		let message;

		try {

			message = JSON.parse(raw.toString());
		}
		catch (err) {

			console.error(
				'[CLIENT] Invalid JSON:',
				err
			);

			socket.close();

			return;
		}



		// ========================================
		// ROUTER
		// ========================================

		switch (message.type) {

			case 'post:create': {
				console.debug('[CLIENT] POST:', message);

				const url = new URL(socket.url);
				const baseUrl = `http://${url.host}`;

				const post = message.payload;
				const item = post.item;

				if (item) {

					item.remote = socket.remoteId;

					switch (post.type) {
						case 'track':
						item.path = baseUrl + item.path;
						if (item.thumb_path)
							item.thumb_path = convertThumbPath(item.thumb_path, baseUrl);
						break;

						case 'album':
						case 'playlist':
						case 'playset':
						if (item.cover_path)
							item.cover_path = convertThumbPath(item.cover_path, baseUrl);
						break;

						case 'radio':
						if (item.favicon)
							item.favicon = convertThumbPath(item.favicon, baseUrl);
						break;

					}
				}

				post.remote = socket.remoteId;

				events.emit('post:create', post);
			}
			break;

			case 'comment:added': {
				const comment =  message.payload;
				comment.remote = socket.remoteId;

				console.debug('[CLIENT] comment:', comment);

				events.emit('comment:added', comment);
			}
			break;

			case 'reaction:added': {
				const reaction = message.payload;
				reaction.remote = socket.remoteId;

				console.debug('[CLIENT] reaction:', reaction);

				events.emit('reaction:added', reaction);
			}
			break;

			default:

			console.warn(
				'[CLIENT] Unknown message:',
				message.type
			);
			break;
		}
	}

	#startCleaner() {
		// Cleanup idle connections periodically

		setInterval(() => {

			const now = Date.now();

			for (const [remoteId, conn] of this.#connections) {

				// Do not destroy active connections

				if (conn.refCount > 0)
					continue;

				// Keep idle socket for a few seconds
				// to avoid reconnect spam when user
				// quickly switches views

				if (now - conn.lastUsed > 10000) {

					console.debug('[CLIENT] Closing idle connection:', remoteId);

					conn.socket.close();

					this.#connections.delete(remoteId);
				}
			}

		}, 5000);
	}
}

function convertThumbPath(path, baseUrl) {
	return path.split(',').map(i => baseUrl + i).join(',');
}

export default ClientManager.instance;