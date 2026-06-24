
import db from '../../db'
import { normalizePaths } from './common'

export default async function tracksRoutes(app) {

	app.get('/', async (req, reply) => {

		console.debug('Get tracks:', req.query);

		// const base = `${req.protocol}://${req.headers.host}`;

		const { filter, query, playlistId, sort, offset, limit } = req.query;
		const tracks = db.getTracks(filter, query, playlistId, sort, offset, limit);

		//console.debug('Tracks', tracks);

		return normalizePaths(tracks);
	});

	app.post('/update', async (req) => {

		return {
			ok: true
		};
	});
}