
import lib from '../../services/library';

export default async function routes(app) {

	// app.get('/', async (req, reply) => {

	// 	const query = req.query;

	// 	query.limit = query.limit ? parseInt(query.limit) : 50;
	// 	query.offset = query.offset ? parseInt(query.offset) : 0;

	// 	const albums = db.library.queryCollections('albums', query);

	// 	return normalizeCoverPaths(albums);
	// });

	app.get('/:id/tracks', async (req, reply) => {
		const id = parseInt(req.params.id);
		return lib.getAlbumTracks(id, true);
	});
	
}