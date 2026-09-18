import { join, isAbsolute } from 'node:path';

import { WorkerBase } from './worker';
import { ProgressBar } from './utils/progress-bar';
import { LibraryDatabase } from './db/library';

import store from './store';

const THUMBS_DIR = store.thumbDir;
const DATABASE_DIR = store.databaseDir;

class ScanWorker extends WorkerBase {

	#handler = new ProgressBar();
    #albums = 0;
	#resolve;
	#reject;

	constructor() {
		const userDirs = {
			thumbs: THUMBS_DIR,
			database: DATABASE_DIR
		};

		super(join(__dirname, 'scanner.js'), { userDirs });
	}

	scan(path) {
		this.post({ type: 'add', path });
	}

    async run(paths) {
        const finished = new Promise((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;
        });

        // for (const path of paths) {
        //     this.scan(path);
        // }
        this.scan(paths);

        return finished;
    }

	// wait() {
	// 	return new Promise((resolve, reject) => {
	// 		this.#resolve = resolve;
	// 		this.#reject = reject;
	// 	});
	// }

	onMessage(msg) {
		switch (msg.type) {

			case 'scan-complete':
            this.#handler.start(msg.total);
            break;

			case 'progress':
            this.#handler.update(
                msg.processed,
                msg.tracks?.at(-1)?.title
            );
            break;

			case 'album':
            this.#albums++;
            break;

			case 'done':
            msg.albums = this.#albums;
            this.#handler.finish(msg);
            this.post('SHUTDOWN');
            this.#resolve?.(msg);
            break;

			case 'cancelled':
            this.#resolve?.(msg);
            break;

			case 'error':
            this.#reject?.(msg.error);
            break;
		}
	}
}

export async function importPaths(paths) {

    const db = new LibraryDatabase();

    db.init(store);
    db.close();

	const scanner = new ScanWorker();

    try {

	    await scanner.run(paths);

        process.stdout.write('Import complete!\n');
    }
    catch (e) {
        process.stderr.write(`Import failed: ${e.messsage}\n`);
    }
}

