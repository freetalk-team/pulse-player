import vm from 'node:vm';

import db from '../db';

const api = {
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

			console.debug('Http GET:', fullUrl);

			const id = fullUrl.hashHex();

			let res;

			res = db.get(id, 'requests');

			if (res?.response) {
				console.debug('Response found in database:', id);
				return JSON.parse(res.response);
			}
			
			try {

				res = await fetch(fullUrl, { headers });

				if (res.ok) {

					const response = await res.text();

					db.insert({ id, response }, 'requests');

					return JSON.parse(response);
				}
			}
			catch (e) {
				console.error('🚨 Failed to send http GET:', e);
			}

	  	}
	}),

	log: (...args) => console.log('[component]', ...args)
}

export function run(component, params) {
	

	return component.builtin
		? runBuiltinComponent(component, params)
		: runUserComponent(component, params);

	async function runBuiltinComponent(component, params) {

		if (!component.run) {

			component.run = new Function(...Object.keys(api), 'config', ...Object.keys(params),
				`
				return (async () => {
					${component.code}
				})();
				`
			);
		}

		return component.run(...Object.values(api), component.config, ...Object.values(params));
	}

	function compileUserCode(component, params) {

		return new vm.Script(`
			(async (config, params) => {
				const { ${Object.keys(params).join(', ')} } = params;

				${component.code}
			})
		`);
	}


	async function runUserComponent(component, params) {

		if (!component.run) {

			const script = compileUserCode(component, params);
			const context = vm.createContext({...api});

			component.run = script.runInContext(context, { timeout: component.timeout || 5000 });

		}

		return component.run(component.config, params);
	}

}
