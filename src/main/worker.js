
import { Worker } from 'worker_threads';

export class WorkerBase {

	#worker;
	#idleTimer;
	#destroyTimeout;
	#path;
	#data;

	constructor(path, data, destroyTimeout=5000) {
		this.#path = path;
		this.#data = data;
		this.#destroyTimeout = destroyTimeout;
	}

	post(msg) {
		this.#start();
		this.#worker.postMessage(msg);
	}


	cancel() {
		if (this.#worker) {
			this.#worker.postMessage('CANCEL');
		}
	}

	scheduleDestroy() {
		clearTimeout(this.#idleTimer);

		this.#idleTimer = setTimeout(() => {
			if (this.#worker) {
				console.debug('Destroying idle worker...');
				// this.#worker.terminate()
				this.#worker.postMessage({ type: 'SHUTDOWN' });
				this.#worker = null;
			}
		}, this.#destroyTimeout)
	}

	onMessage() {}

	#start() {
		if (this.#worker) {

			if (this.#idleTimer) {
				clearTimeout(this.#idleTimer);
				this.#idleTimer = null;
			}

			return;
		}

		this.#worker = new Worker(this.#path, { workerData: this.#data});

		this.#worker.on('message', (msg) => {

			if (typeof msg == 'string') {

				switch (msg) {

					case 'IDLE':
					this.scheduleDestroy();
					break;

				}

				return;
			}

			this.onMessage(msg);
		});
			
		this.#worker.on('exit', () => {
			console.debug('WORKER exit');
			this.#worker = null;
		});
	}
}