import { join } from 'node:path';

import { PluginDatabase } from "../db/plugin";
import { CacheDatabase } from "../db/cache";

import { run } from './execute';

export class ComponentsBase {

	#components;
	#cache;

	constructor(dbRoot, type) {
		this.#components = loadComponents(dbRoot, type);
		this.#cache = CacheDatabase.create(dbRoot);
	}

	async run(params) {
		for (const component of this.#components) {

			console.debug(`Executing component: builtin=${component.builtin}`, component.name, component.config);

			try {

				const res = await run(component, this.#cache, params);

				if (res) 
					return res;
			}
			catch (e) {
				console.error('🚨 Failed to execute component:', component.name, e);
			}
		}
	}

	destroy() {
		this.#cache.close();
	}
}

function loadComponents(dbRoot, type) {
	const db = PluginDatabase.create(dbRoot, { readOnly: true });

	const components = db.getComponents(type);

	db.close();

	return components;
}