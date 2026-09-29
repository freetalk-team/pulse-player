
const apiUrl = import.meta.env.VITE_API_URL || '';

const platform = {

	resolve(path) { 
		return apiUrl + path 
	},

	async play(element, path) {
		if (element.src?.startsWith('blob:'))
			URL.revokeObjectURL(element.src);

		let url;

		console.debug('Play stream:', path);

		if (typeof FileSystemFileHandle !== 'undefined' && path instanceof FileSystemFileHandle) {
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

	remote: true
}

window.platform = platform;
