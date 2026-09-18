import { DatabaseBase } from './base';

import createRequestsSQL from './sql/schema/007_create_requests.sql?raw';

export class CacheDatabase extends DatabaseBase {

    static dbname = 'cache';
    static requests = 'requests';

    init(storage) {
		super.init(CacheDatabase.dbname, storage);

        // todo: clean old
    }

    onCreate() {
        this.exec(createRequestsSQL);
    }

    getResponse(id) {
        const row = super.get(CacheDatabase.requests, id, 'response');

        return row?.response;
    }

    insertResponse(id, response) {
        super.insert(CacheDatabase.requests, { id, response });
    }
}