import fs from 'node:fs'
import { join } from 'node:path'

import fastifyStatic from '@fastify/static'

import lib from '../../services/library'
import store from '../../store'

export default async function routes(app) {

	await app.register(fastifyStatic, {
		root: store.thumbDir,
		prefix: '/thumb/'
	});

	app.route({
		method: ['GET', 'HEAD'],
		url: '/media/:id',
		handler: async (req, reply) => {
			const id = parseInt(req.params.id);

			const path = lib.db.getTrackPath(id);
			const stat = fs.statSync(path);

			// Core global headers for both GET and HEAD
			reply.header('Accept-Ranges', 'bytes');

			const range = req.headers.range;

			if (!range) {
				reply.header('Content-Length', stat.size);
				
				// If it's just a HEAD request, skip sending the stream body
				if (req.method === 'HEAD') {
					return reply.send();
				}
				
				return reply.send(fs.createReadStream(path));
			}

			// Handle Range Requests (same as before)
			const parts = range.replace(/bytes=/, '').split('-');
			const start = parseInt(parts[0], 10);
			const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
			const chunkSize = (end - start) + 1;

			reply.code(206);
			reply.header('Content-Range', `bytes ${start}-${end}/${stat.size}`);
			reply.header('Content-Length', chunkSize);

			// If it's a HEAD request matching a range query, stop here too
			if (req.method === 'HEAD') {
				return reply.send();
			}

			const stream = fs.createReadStream(path, { start, end });
			return reply.send(stream);
		}
	});

}