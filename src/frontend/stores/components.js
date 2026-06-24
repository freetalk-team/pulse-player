import { writable, get } from "svelte/store";

import { sleep } from "../utils/sleep";
import { confirmAction } from "./ui";

export const albumComponents = writable([]);
export const trackComponents = writable([]);
export const selectedComponent = writable(null);
export const isLoading = writable(false);

const LOADING_TIMEOUT = 600;

let loaded = false;
let saving = false;

albumComponents.subscribe(items => {
	if (!loaded || saving) return;

	updateOrder(items);
});

trackComponents.subscribe(items => {
	if (!loaded || saving) return;

	updateOrder(items);
});

export async function loadComponents() {

	if (loaded) return;

	const comps = await api.getComponents();

	console.debug('Components loaded:', comps);

	// components.set(comps);

	albumComponents.set(comps.filter(i => i.type == 'album'));
	trackComponents.set(comps.filter(i => i.type == 'track'));

	loaded = true;
}

export async function loadComponent(component) {
	
	const id = typeof component == 'object' ? component.id : component;

	isLoading.set(true);

	try {

		const [comp] = await Promise.all([
			api.getComponent(id),
			sleep(LOADING_TIMEOUT)
		]);

		const schema = JSON.parse(comp.schema);
		const config = JSON.parse(comp.config);

		for (const prop of schema) {
			config[prop.key] = config[prop.key] ?? prop.default ?? '';
		}

		config.headers = config.headers || [];

		comp.schema = schema;
		comp.config = config;

		console.debug('Component loaded:', comp);

		selectedComponent.set(comp);
	}
	finally {
		isLoading.set(false);

	}
}

export async function updateOrder(components) {

	const items = components.map((i, index) => ({ id: i.id, priority: index + 1 }))

	await api.updateComponentsOrder(items);

}

export async function enableComponent(component, enable) {
	const id = typeof component == 'object' ? component.id : component;

	saving = true;

	await api.enableComponent(id, enable);

	const components = component.type == 'album' ? albumComponents : trackComponents;

	components.update(list => list.map(i => i.id == id ? {...i, enabled: enable} : i));

	if (id == get(selectedComponent)?.id)
		selectedComponent.update(comp => ({ ...comp, enabled: enable }));


	saving = false;
}

export async function newComponent(type) {

	const templates = {
		album: 
`/**
 * Component: Album Enricher
 *
 * Available objects:
 * - album: { name, artist, year }
 *   Methods:
 *     album.setThumbnail(url)
 *     album.setYear(year)
 *     album.setGenre(genre)
 *     album.setDescription(text)
 *
 * - http:
 *     http.get(path, params, headers)
 *
 * - config:
 *     config.baseUrl
 *     config.apiKey
 */`,
 		track: 
`/**
 * Component: Track Enricher
 *
 * Available objects:
 * - track: { title, artist }
 *   Methods:
 *     track.setThumbnail(url)
 *     track.setGenre(genre)
 *     track.setDescription(text)
 *     album.setName(name)
 *     album.setThumbnail(url)
 *     album.setGenre(genre)
 *     album.setYear(year)
 *     album.setDescription(text)
 *
 * - http:
 *     http.get(path, params, headers)
 *
 * - config:
 *     config.baseUrl
 *     config.apiKey
 */`
	}

	isLoading.set(true);
	
	selectedComponent.set({
		name: '',
		description: '',
		type,
		builtin: false,
		enabled: false,
		code: templates[type],
		schema: [
			{
				key: 'baseUrl',
				label: 'Base URL',
				type: 'url',
				required: true
			},
			{
				key: 'apiKey',
				label: 'API Key',
				type: 'text'
			},
			{
				key: 'headers',
				label: 'Headers',
				type: 'keyvalue'
			}
		],
		config: {
			headers: []
		},
		priority: 100
	});

	await sleep(LOADING_TIMEOUT);

	isLoading.set(false);
}

export async function saveComponent(component) {

	saving = true;

	isLoading.set(true);

	if (!component)
		component = get(selectedComponent);

	const [id] = await Promise.all([
		api.saveComponent(component),
		sleep(LOADING_TIMEOUT)
	]);

	const components = component.type == 'album' ? albumComponents : trackComponents;

	if (component.id) {
		components.update(list => list.map(c => 
        	c.id === id 
            ? { ...c, name: component.name, description: component.description } 
            : c
    	));
	}
	else {
		component.id = id;

		components.update(list => [...list, component]);
	}

	selectedComponent.set(component);

	isLoading.set(false);

	saving = false;
}

export async function deleteComponent(component) {
	const id = typeof component == 'object' ? component.id : component;

	const confirmed = await confirmAction({
		title: 'Delete component?',
		message: `This will permanently remove component.`,
		confirmText: 'Delete',
		danger: true
	});

	if (confirmed) {

		saving = true;

		await api.deleteComponent(id);

		const components = component.type == 'album' ? albumComponents : trackComponents;

		components.update(list => list.filter(i => i.id != id));

		if (id == get(selectedComponent)?.id)
			selectedComponent.set(null);

		saving = false;
	}
}