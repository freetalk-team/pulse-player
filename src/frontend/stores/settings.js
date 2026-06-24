import { writable, get } from "svelte/store";

import { selectedComponent } from "./components";

export const currentSettings = writable('general');

selectedComponent.subscribe(comp => {

	if (comp) {
		currentSettings.set('component');
	}
	else if (get(currentSettings) === 'component') {
		currentSettings.set('general');
	}

});
