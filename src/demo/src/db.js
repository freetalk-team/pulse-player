
import { Database as DatabaseBase } from "@frontend/db";

class Database extends DatabaseBase {

    static instance = new Database('player');

    onUpgrade(db, txn, ver) {
		switch (ver) {
		
			case 0:

            Database.addTable(db, 'thumb');

            Database.addTable(db, 'track');
			Database.addIndex('track', 'type', txn);
			Database.addIndex('track', 'played_at', txn);
			Database.addIndex('track', 'created_at', txn);
			Database.addIndex('track', 'rating', txn);
			Database.addIndex('track', ['type', 'played_at'], txn);
			Database.addIndex('track', ['type', 'created_at'], txn);
			Database.addIndex('track', ['type', 'rating'], txn);

			Database.addTable(db, 'collection', true);
			Database.addIndex('collection', 'type', txn);
			Database.addIndex('collection', 'played_at', txn);
			Database.addIndex('collection', 'created_at', txn);
			Database.addIndex('collection', 'total_rating', txn, false, 'rating');
            Database.addIndex('collection', ['type', 'name', 'artist'], txn, true);
            Database.addIndex('collection', ['type', 'played_at'], txn);
            Database.addIndex('collection', ['type', 'created_at'], txn);
            Database.addIndex('collection', ['type', 'total_rating'], txn, false, 'type_rating');

            Database.addTable(db, 'collection_tracks', true);
			Database.addIndex('collection_tracks', 'collection_id', txn);
			Database.addIndex('collection_tracks', 'track_id', txn);
			Database.addIndex('collection_tracks', ['collection_id', 'position'], txn, true, 'track_position');

			Database.addTable(db, 'playset');
            Database.addIndex('playset', 'played_at', txn);
            Database.addIndex('playset', 'created_at', txn);
            Database.addIndex('playset', 'total_rating', txn, false, 'rating');

            Database.addTable(db, 'playset_members', true);
			Database.addIndex('playset_members', 'playset_id', txn);
			Database.addIndex('playset_members', 'member_id', txn);
			Database.addIndex('playset_members', ['playset_id', 'position'], txn, true, 'member_position');

			Database.addTable(db, 'station');
			Database.addIndex('station', 'rating', txn);
			Database.addIndex('station', 'played_at', txn, false, 'recent');
			Database.addIndex('station', 'favourite', txn);
			Database.addIndex('station', ['favourite', 'rating'], txn);

			Database.addTable(db, 'station_search', true);
			Database.addIndex('station_search', 'query', txn, true);

			break;
		}
	}
}

export default Database.instance;