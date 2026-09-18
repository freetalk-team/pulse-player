
import { parse } from 'node:path';

import store from './store';


class Database {

	static instance = new Database;

	init() {
		console.debug('Initalizing DB:');
	}

	destroy() {
	}
	

	// Collections
	// getCollections(collections, query, sort = 'rating', id = null, offset = 0, limit = 200) {

	// 	console.debug('[DB] Collection:', collections);

	// 	if (typeof collections === 'string' && collections === 'playset' && id)
	// 		return this.#getPlayset(id, query, sort, offset, limit);

	// 	return this.#getCollections(collections, query, sort, offset, limit);
	// }

	
}

export default Database.instance;
