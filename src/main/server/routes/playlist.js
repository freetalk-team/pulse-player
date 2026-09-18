
import lib from '../../services/library';

export default async function routes(app) {

	// app.get('/', async (req, reply) => {

	// 	// console.debug('Get tracks:', req.query);

	// 	// const base = `${req.protocol}://${req.headers.host}`;

	// 	query.limit = query.limit ? parseInt(query.limit) : 50;
	// 	query.offset = query.offset ? parseInt(query.offset) : 0;

	// 	const playlists = db.library.queryCollections('playlists', query);

	// 	//console.debug('Tracks', tracks);

	// 	return normalizeCoverPaths(playlists);
	// });

	app.get('/:id/tracks', async (req, reply) => {
		const id = parseInt(req.params.id);
		return lib.getPlaylistTracks(id, true);	
	});
	
}