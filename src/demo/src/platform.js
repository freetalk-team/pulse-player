import db from './db';

const apiUrl = import.meta.env.VITE_API_URL || '';
const THUMB_CACHE_TIMEOUT = 30_000;

const platform = {

	cache: new Map(),

	resolve(path) { 
		// return path.startsWith('blob') ? path : apiUrl + path 
		return path;
	}, 

	async play(element, path) {
		if (element.src?.startsWith('blob:'))
			URL.revokeObjectURL(element.src);

		let url;

		console.debug('Play stream:', path);

		if (path instanceof FileSystemFileHandle) {
			const file = await path.getFile();

			url = URL.createObjectURL(file);
		}
		else {

			if (path.endsWith('.m3u') || path.endsWith('.pls')) {
				url = await fetchStream(path);
			}
			else {
				url = path;
			}

		}

		element.src = url;

		return element.play();

		
	},

	async resolveStreamUrl(url) {
		
	},

	async getThumb(id) {
		let entry = this.cache.get(id);

		if (entry) {
			entry.refs++;

			if (entry.timer) {
				clearTimeout(entry.timer);
				entry.timer = null;
			}

			return entry.promise;
		}

		entry = {
			refs: 1,
			timer: null,
			promise: this.loadThumb(id)
		};

		this.cache.set(id, entry);

		try {
			return await entry.promise;
		} catch (error) {
			this.cache.delete(id);
			throw error;
		}
	},

	async loadThumb(id) {
		console.debug('Platform loading thumb:', id);

		const thumb = await db.get('thumb', id);

		if (!thumb) {
			return null;
		}

		console.debug('Creating object URL:', id);

		return URL.createObjectURL(thumb.blob);
	},

	releaseThumb(id) {
		const entry = this.cache.get(id);

		if (!entry) {
			return;
		}

		entry.refs--;

		if (entry.refs > 0 || entry.timer) {
			return;
		}

		entry.timer = setTimeout(() => {
			const current = this.cache.get(id);

			if (!current || current.refs > 0) {
				return;
			}

			this.cache.delete(id);

			current.promise.then((url) => {
				if (url) {
					URL.revokeObjectURL(url);
				}
			});
		}, THUMB_CACHE_TIMEOUT);
	}
}

async function fetchStream(url) {
	const response = await fetch(url);
	const text = await response.text();

	console.debug('Fetched stream:', text);

	for (const line of text.split(/\r?\n/)) {
		const lineTrimmed = line.trim();

		if (
			lineTrimmed &&
			!lineTrimmed.startsWith('#') &&
			/^https?:\/\//i.test(lineTrimmed)
		) {
			return lineTrimmed;
		}
	}

	throw new Error('No stream URL found in playlist');
}

window.platform = platform;