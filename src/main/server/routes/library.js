import { basename } from 'node:path';

// import lib from '../../services/library';

export default async function libraryRoutes(app) {

	app.get('/', (req, reply) => lib.getStat());

	app.get('/album', (req, reply) => {

		let { limit } = req.query;

		limit = limit ? parseInt(limit) : 16;

		const albums = db.library.getTop('albums', limit);

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