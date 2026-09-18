
import events from "./events";

const IDLE_TIMEOUT = 30_000;

class Scanner {

	static instance = new Scanner;

	#worker;
	#idleTimer;

	scan(handles) {
		this.#loadWorker();

		

		this.#worker.postMessage({
			type: 'add',
			handles
		});
	}

	#loadWorker() {
		if (this.#worker) {
			this.#cancelIdleShutdown();
			return;
		}

		this.#worker = new Worker(
			new URL('./workers/import.worker.js', import.meta.url),
			{
				type: 'module'
			}
		);

		this.#worker.addEventListener('message', (event) => this.#handleMessage(event.data));
		this.#worker.addEventListener('error', (event) => {
			const error =
					event.error ??
					new Error(event.message || 'Metadata worker failed');


			this.#destroyWorker();
		});

	}

	#handleMessage(msg) {

		switch (msg.type) {

			case 'scan-start':
			events.emit('import-start');
			break;

			case 'progress':
			//events.emit('import-progress');
			console.debug('Import progress:', msg);
			events.emit('import-progress', msg);
			break;

			case 'complete':
			//events.emit('import-progress');
			console.debug('Import complete:', msg);
			events.emit('import-end');
			this.#scheduleIdleShutdown();
			break;

			case 'album':
			console.debug('Album added:', msg.name);
			events.emit('import-album', msg);
			break;
		}

	}

	#scheduleIdleShutdown() {
		this.#cancelIdleShutdown();
		this.#idleTimer = setTimeout(() => {
			this.#worker.postMessage('SHUTDOWN');
			this.#worker = null;
		}, IDLE_TIMEOUT);
	}

	#cancelIdleShutdown() {
		if (this.#idleTimer) {
			clearTimeout(this.#idleTimer);
			this.#idleTimer = null;
		}
	}

	#destroyWorker() {
		this.#cancelIdleShutdown();

		this.#worker.terminate();
		this.#worker = null;
	}
}

export default Scanner.instance;