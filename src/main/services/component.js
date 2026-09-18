
import { PluginDatabase } from "../db/plugin";
import { CacheDatabase } from "../db/cache";

import store from '../store';

import { migrations } from "../components/migrations";

class ComponentManager {

	static instance = new ComponentManager;

	#plugin = new PluginDatabase

	get plugin() { return this.#plugin; }

	init() {

		this.#plugin.init(store);
		this.#plugin.runMigrations(migrations);

		const cache = new CacheDatabase;

		cache.init(store);
		cache.close();
	}

	destroy() {
		this.#plugin.close();
	}

	registerHandlers(ipc) {
		ipc.handle('get-component', async (event, id) => this.#plugin.get(id));
		ipc.handle('get-components', async (event) => this.#plugin.ls());
		ipc.handle('update-components-priority', (event, components) => this.#plugin.updatePriority(components));
		ipc.handle('save-component', (event, component) => this.#plugin.save(component));
		ipc.handle('delete-component', (event, id) => this.#plugin.delete(id));
		ipc.handle('enable-component', (event, id, enable) => this.#plugin.enable(id, enable));
	}
}

export default ComponentManager.instance;