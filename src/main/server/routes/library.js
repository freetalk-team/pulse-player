import { basename } from 'node:path';

import db from '../../db'

export default async function libraryRoutes(app) {

	app.get('/', (req, reply) => db.getLibraryStat());

	app.get('/album', (req, reply) => {

		let { limit } = req.query;

		limit = limit ? parseInt(limit) : 16;

		const albums = db.getTop('album', limit);

		for (const i of albums) {
			if (i.cover_path) {
				const filename = basename(i.cover_path);

				i.cover_path = `/thumb/${filename}`;
			}
		}

		return albums;
	});

	app.get('/:collection', (req, reply) => {
		const collection = req.params.collection;

		let { limit } = req.query;

		limit = limit ? parseInt(limit) : 16;

		return db.getTop(collection, limit);
	});
}