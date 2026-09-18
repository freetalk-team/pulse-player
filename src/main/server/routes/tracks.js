
import lib from '../../services/library'
import { normalizePaths } from './common'

export default async function routes(app) {

	app.get('/', async (req, reply) => {

		console.debug('Get tracks:', req.query);

		// const base = `${req.protocol}://${req.headers.host}`;

		const query = req.query;

		query.limit = query.limit ? parseInt(query.limit) : 50;
		query.offset = query.offset ? parseInt(query.offset) : 0;
		query.playlist = query.playlist ? parseInt(query.playlist) : null;

		const tracks = lib.queryTracks(query, true);

		//console.debug('Tracks', tracks);

		return tracks;
	});

	app.post('/update', async (req) => {

		return {
			ok: true
		};
	});
}