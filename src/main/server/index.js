import path from 'node:path';

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';

import { app } from 'electron';

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

export async function createServer() {
	const server = Fastify({
		logger: !app.isPackaged
	});

	await server.register(cors, {
		origin: true
	});

	// app.decorate('events', {
	// 	onPostCreated: async (post) => {
	// 		console.log('Post created:', post);
	// 	}
	// });

	// WebSocket support
	await server.register(websocket);

	await server.register(fastifyStatic, {
		root: webRoot,
		prefix: '/'
	});

	server.setNotFoundHandler((req, reply) => {
		reply.sendFile('index.html');
	});

	// Simple HTTP route
	server.get('/api/ping', async () => {
		return {
			ok: true,
			time: Date.now()
		};
	});

	await server.register(websocketRoutes, { prefix: '/ws' });

	await Promise.all([
		server.register(tracksRoutes, { prefix: '/api/tracks' }),
		server.register(albumRoutes, { prefix: '/api/album' }),
		server.register(playlistRoutes, { prefix: '/api/playlist' }),
		server.register(collectionRoutes, { prefix: '/api/collection' }),
		server.register(libraryRoutes, { prefix: '/api/library' }),
		server.register(postRoutes, { prefix: '/api/post' }),
		server.register(radioRoutes, { prefix: '/api/stations' })
	]);
	
	await server.register(mediaRoutes);

	const port = store.port;

	try {
		// Start server
		await server.listen({
			host: '0.0.0.0',
			port
		});

		const addresses = server.addresses();

		console.log('[HTTP] started:', port, addresses.map(i => i.address));
	}
	catch (e) {
		console.error('[HTTP] failed to start server:', e.message);
	}

	return server;
}
