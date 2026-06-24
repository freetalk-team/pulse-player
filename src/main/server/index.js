import path from 'node:path';

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';

import store from '../store';

import websocketRoutes from './routes/ws';

import libraryRoutes from './routes/library';
import tracksRoutes from './routes/tracks';
import albumRoutes from './routes/album';
import playlistRoutes from './routes/playlist';
import collectionRoutes from './routes/collection';
import postRoutes from './routes/post';

import mediaRoutes from './routes/media';

export async function createServer() {
	const app = Fastify({
		logger: true
	});

	await app.register(cors, {
		origin: true
	});

	// app.decorate('events', {
	// 	onPostCreated: async (post) => {
	// 		console.log('Post created:', post);
	// 	}
	// });

	// WebSocket support
	await app.register(websocket);

	await app.register(fastifyStatic, {
		root: path.join(process.cwd(), 'src/web/dist'),
		prefix: '/'
	});

	app.setNotFoundHandler((req, reply) => {
		reply.sendFile('index.html');
	});

	// Simple HTTP route
	app.get('/api/ping', async () => {
		return {
			ok: true,
			time: Date.now()
		};
	});

	await app.register(websocketRoutes, { prefix: '/ws' });

	await Promise.all([
		app.register(tracksRoutes, { prefix: '/api/tracks' }),
		app.register(albumRoutes, { prefix: '/api/album' }),
		app.register(playlistRoutes, { prefix: '/api/playlist' }),
		app.register(collectionRoutes, { prefix: '/api/collection' }),
		app.register(libraryRoutes, { prefix: '/api/library' }),
		app.register(postRoutes, { prefix: '/api/post' })
	]);
	
	await app.register(mediaRoutes);

	const port = store.port;

	// Start server
	await app.listen({
		host: '0.0.0.0',
		port
	});

	console.debug('[SERVER] started:', port);

	return app;
}