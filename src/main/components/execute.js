import vm from 'node:vm';

function createApi(cache) {
	return {
		http: Object.freeze({
			get: async (url, params = {}, headers = []) => {

				const qp = new URLSearchParams();

				for (const [key, value] of Object.entries(params))
					qp.set(key, typeof value == 'string' ? value.toLowerCase() : value);

				// const url = (path.startsWith('http')
				// 	? path 
				// 	: config.baseUrl + path)
				// 	+ qp.toString();

				const fullUrl = qp.size > 0
					? url + '?' + qp.toString()
					: url;

				console.debug('CACHE:', cache);
				console.debug('[HTTP] GET:', fullUrl);
				
				try {

					const id = fullUrl.hashCode();
					const response = cache.getResponse(id);

					if (response) {
						console.debug('Response found in database:', id);
						return JSON.parse(response);
					}

					const res = await fetch(fullUrl, { headers });

					if (res.ok) {

						const response = await res.text();

						console.debug('[HTTP] response:', response);

						cache.insertResponse(id, response);

						return JSON.parse(response);
					}
					else {
						console.debug('[HTTP] no response');
					}
				}
				catch (e) {
					console.error('🚨 Failed to send http GET:', e);
				}

			}
		}),

		log: (...args) => console.log('[component]', ...args)
	};
}

export function run(component, cache, params) {

	return component.builtin
		? runBuiltinComponent(component, cache, params)
		: runUserComponent(component, cache, params);
}

async function runBuiltinComponent(component, cache, params) {

	const api = createApi(cache);

	if (!component.run) {

		component.run = new Function(
			...Object.keys(api), 
			'config', 
			...Object.keys(params),
			`
			return (async () => {
				${component.code}
			})();
			`
		);
	}

	return component.run(
		...Object.values(api), 
		component.config, 
		...Object.values(params)
	);
}

function compileUserCode(component, params) {

	return new vm.Script(`
		(async (config, params) => {
			const { ${Object.keys(params).join(', ')} } = params;

			${component.code}
		})
	`);
}


async function runUserComponent(component, cache, params) {

	if (!component.run) {

		const api = createApi(cache);

		const script = compileUserCode(component, params);
		const context = vm.createContext(api);

		component.run = script.runInContext(context, { timeout: component.timeout || 5000 });

	}

	return component.run(component.config, params);
}
