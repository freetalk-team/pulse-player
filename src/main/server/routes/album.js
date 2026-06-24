
import db from '../../db'

import { normalizePaths, normalizeCoverPaths } from './common'

export default async function routes(app) {

	app.get('/', async (req, reply) => {

		// console.debug('Get tracks:', req.query);

		// const base = `${req.protocol}://${req.headers.host}`;

		const { filter, query, sort, offset, limit } = req.query;
		const albums = db.getCollections('album', query, sort, offset, limit);

		//console.debug('Tracks', tracks);

		return normalizeCoverPaths(albums);
	});

	app.get('/:id/tracks', async (req, reply) => {

		let { offset, limit } = req.query;
		let { id } = req.params;

		id = parseInt(id);
		offset = offset ? parseInt(offset) : 0;
		limit = limit ? parseInt(limit) : 200;

		const tracks = db.getAlbumTracks(id, offset, limit);

		return normalizePaths(tracks);
	});
	
}