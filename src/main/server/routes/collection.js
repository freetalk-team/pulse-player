
import lib from '../../services/library';

import { normalizeCoverPaths } from './common'

export default async function routes(app) {

	app.get('/:collection', async (req, reply) => {

		const { collection } = req.params;
		const query = req.query;

		query.limit = query.limit ? parseInt(query.limit) : 30;
		query.offset = query.offset ? parseInt(query.offset) : 0;
		query.id = query.id ? parseInt(query.id) : null;
		
		return lib.queryCollections(collection, query, true);
	});
	
}