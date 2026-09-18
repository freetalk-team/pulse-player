
import { Database as DatabaseBase } from "@frontend/db";

class Database extends DatabaseBase {

    static instance = new Database('pulse-player');

    onUpgrade(db, txn, ver) {
		switch (ver) {
		
			case 0:
			Database.addTable(db, 'recent');
			Database.addIndex('recent', 'played_at', txn);

			Database.addTable(db, 'playlist');
			Database.addIndex('playlist', 'played_at', txn);

			case 1:
			// Database.addTable(db, 'file');
			// Database.addIndex('file', 'type', txn);

			break;
		}
	}
}

export default Database.instance;