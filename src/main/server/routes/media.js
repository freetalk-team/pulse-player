import fs from 'node:fs'
import { join } from 'node:path'

import fastifyStatic from '@fastify/static'

import db from '../../db'
import store from '../../store'

export default async function mediaRoutes(app) {

	await app.register(fastifyStatic, {
		root: store.thumbDir,
		prefix: '/thumb/'
	});

	app.get('/media/:id', async (req, reply) => {

		const path = db.getTrackPath(req.params.id);
		const stat = fs.statSync(path);

		reply.header('Accept-Ranges', 'bytes');

		const range = req.headers.range;

		if (!range) {
			return reply.send(fs.createReadStream(path));
		}

		const parts = range.replace(/bytes=/, '').split('-');

		const start = parseInt(parts[0], 10);

		const end = parts[1]
			? parseInt(parts[1], 10)
			: stat.size - 1;

		const chunkSize = (end - start) + 1;

		const stream = fs.createReadStream(path, {
			start,
			end
		});

		reply.code(206);

		reply.header('Content-Range', `bytes ${start}-${end}/${stat.size}`);
		reply.header('Content-Length', chunkSize);

		return reply.send(stream);
	});
}