import path from 'node:path';

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';

import { app } from 'electron';

import { events } from '../events';
import store from '../store';

import websocketRoutes from './routes/ws';

import libraryRoutes from './routes/library';
import tracksRoutes from './routes/tracks';
import albumRoutes from './routes/album';
import playlistRoutes from './routes/playlist';
import collectionRoutes from './routes/collection';
import postRoutes from './routes/post';
import radioRoutes from './routes/radio';

import mediaRoutes from './routes/media';

const webRoot = app.isPackaged
    ? path.join(process.resourcesPath, 'web')
    : path.join(process.cwd(), 'resources', 'web');

class Server {

	#fastify;

	async start() {
		if (this.#fastify) return;

		const fastify = Fastify({
			logger: !app.isPackaged
		});

		await fastify.register(cors, {
			origin: true
		});

		// app.decorate('events', {
		// 	onPostCreated: async (post) => {
		// 		console.log('Post created:', post);
		// 	}
		// });

		// WebSocket support
		await fastify.register(websocket);

		await fastify.register(fastifyStatic, {
			root: webRoot,
			prefix: '/'
		});

		fastify.setNotFoundHandler((req, reply) => {
			reply.sendFile('index.html');
		});

		// Simple HTTP route
		fastify.get('/api/ping', async () => {
			return {
				ok: true,
				time: Date.now()
			};
		});

		await fastify.register(websocketRoutes, { prefix: '/ws' });

		await Promise.all([
			fastify.register(tracksRoutes, { prefix: '/api/tracks' }),
			fastify.register(albumRoutes, { prefix: '/api/album' }),
			fastify.register(playlistRoutes, { prefix: '/api/playlist' }),
			fastify.register(collectionRoutes, { prefix: '/api/collection' }),
			fastify.register(libraryRoutes, { prefix: '/api/library' }),
			fastify.register(postRoutes, { prefix: '/api/post' }),
			fastify.register(radioRoutes, { prefix: '/api/stations' })
		]);
		
		await fastify.register(mediaRoutes);

		const port = store.port;

		try {
			// Start server
			await fastify.listen({
				host: '0.0.0.0',
				port
			});

			const addresses = fastify.addresses();

			console.log('[HTTP] started:', port, addresses.map(i => i.address));

			this.#fastify = fastify;
		}
		catch (e) {
			console.error('[HTTP] failed to start server:', e.message);

			events.emit('error', 'Failed to start HTTP server');
		}
	}

	async stop() {
		if (!this.#fastify) return;

		try {
			await this.#fastify.close();
			
		}
		catch (e) {
			console.error('[HTTP] Failed to stop server:', e.message);
		}
		finally {
			this.#fastify = null;
		}
	}
}

export async function createServer() {

	const server = new Server;

	const enabled = store.registerListener('remoteEnabled', (enable) => {
		if (enable) 
			server.start();
		else
			server.stop();
	});

	if (enabled) {
		await server.start();
	}

	return server;
}
