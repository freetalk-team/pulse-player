
import discovery from './discovery';
import { events } from './events';

WebSocket.prototype.sendMessage = function(type, payload) {
	this.send(JSON.stringify({ type, payload }));
}

class Client {

	#connections = new Map();

	constructor() {

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

	// ============================================
	// PUBLIC API
	// ============================================

	getSocket(remoteId) {
		return this.#connections.get(remoteId);
	}

	async acquire(remoteId) {

		let conn = this.#connections.get(remoteId);

		// Existing connection

		if (conn) {

			conn.refCount++;
			conn.lastUsed = Date.now();

			console.debug(
				'[CLIENT] Reusing connection:',
				remoteId,
				'refs:',
				conn.refCount
			);

			return conn.socket;
		}

		// Create new connection

		const socket = await this.#createConnection(remoteId);

		conn = {
			remoteId,
			socket,
			refCount: 1,
			lastUsed: Date.now(),
			state: 'connected'
		};

		this.#connections.set(remoteId, conn);

		console.debug('[CLIENT] Connected:', remoteId);

		return socket;
	}

	release(remoteId) {

		const conn = this.#connections.get(remoteId);

		if (!conn)
			return;

		conn.refCount--;

		conn.lastUsed = Date.now();

		console.debug(
			'[CLIENT] Release:',
			remoteId,
			'refs:',
			conn.refCount
		);

		// Actual socket close handled
		// by idle cleanup loop
	}

	send(remoteId, type, data = {}) {

		const conn = this.#connections.get(remoteId);

		if (!conn) {

			console.warn('[CLIENT] No connection:', remoteId);

			return;
		}

		if (conn.socket.readyState !== WebSocket.OPEN) {

			console.warn('[CLIENT] Socket not open:', remoteId);

			return;
		}

		conn.socket.send(JSON.stringify({
			type,
			...data
		}));
	}

	isConnected(remoteId) {

		const conn = this.#connections.get(remoteId);

		if (!conn)
			return false;

		return conn.socket.readyState === WebSocket.OPEN;
	}

	getConnection(remoteId) {

		return this.#connections.get(remoteId);
	}

	// ============================================
	// INTERNAL
	// ============================================

	#createConnection(remoteId) {

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
					name: discovery.name,
					version: 1
				}));

				resolve(socket);
			};

			socket.onmessage = event => {

				this.#handleMessage(socket, event.data);
			};

			socket.onclose = () => {

				console.debug(
					'[CLIENT] Disconnected:',
					socket.remoteId
				);

				const conn = this.#connections.get(
					socket.remoteId
				);

				// Prevent stale socket cleanup

				if (conn?.socket === socket) {

					this.#connections.delete(
						socket.remoteId
					);
				}
			};

			socket.onerror = err => {

				console.error(
					'[CLIENT] Socket error:',
					err.message
				);

				const conn = this.#connections.get(
					socket.remoteId
				);

				if (conn?.socket === socket) {

					this.#connections.delete(
						socket.remoteId
					);
				}

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

		//console.debug('[WS]');

		const conn = this.#connections.get(
			socket.remoteId
		);

		if (conn) {

			conn.lastUsed = Date.now();
		}

		// ========================================
		// ROUTER
		// ========================================

		switch (message.type) {

			case 'hello':

				console.debug(
					'[CLIENT] HELLO:',
					message
				);

			break;

			case 'ping':

				this.send(
					socket.remoteId,
					'pong'
				);

			break;

			case 'pong':

				// heartbeat response

			break;

			case 'play':

				console.log(
					'[CLIENT] PLAY:',
					message.trackId
				);

			break;

			case 'pause':

				console.log(
					'[CLIENT] PAUSE'
				);

			break;

			case 'post:create': {
				console.debug('[CLIENT] POST:', message);

				const url = new URL(socket.url);
				const baseUrl = `http://${url.host}`;

				const post = message.payload;
				const item = post.item;

				switch (post.type) {
					case 'track':
					item.path = baseUrl + item.path;
					if (item.thumb_path)
						item.thumb_path = baseUrl + item.thumb_path;
					break;
				}

				events.emit('post:create', post);
			}
			break;

			case 'comment:added':
			console.debug('[CLIENT] comment:', message.payload);
			events.emit('comment:added', message.payload);
			break;

			default:

				console.warn(
					'[CLIENT] Unknown message:',
					message.type
				);
		}
	}
}

export default new Client();