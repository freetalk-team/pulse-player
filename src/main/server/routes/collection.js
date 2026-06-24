
import db from '../../db'

import { normalizeCoverPaths } from './common'

export default async function routes(app) {

	app.get('/:collection', async (req, reply) => {

		const { collection } = req.params;
		
		let { query, sort, offset, limit, id } = req.query;

		offset = offset ? parseInt(offset) : 0;
		limit = limit ? parseInt(limit) : 30;
		id = id ? parseInt(id) : null;

		const sets = db.getCollections(collection, query, sort, id, offset, limit);

		return normalizeCoverPaths(sets);
	});
	
}