import { writable, get } from "svelte/store";

import { sleep } from "../utils/sleep";

import { playRadio } from "./play";
import { fetchCall } from './fetch';

export const activeOrder = writable('rating');
export const searchQuery = writable("");
export const favourite = writable([]);
export const recent = writable([]);
export const stations = writable([]);
export const currentStation = writable(null);
export const selectedStation = writable(null);
export const selectedView = writable('stations');

export const isLoading = writable(false);
export const hasMore = writable(true);

export const fetch = fetchCall(api.queryStations, stations, isLoading, hasMore, buildQuery);

const SEARCH_TIMEOUT = 400;

let loaded = false;
let search = '';
let searchTimeout;

const lastRequest = {};

activeOrder.subscribe(v => {
	if (!loaded) return;
	fetch({}, true);
});

searchQuery.subscribe(v => {
	if (!loaded) return;


	if (searchTimeout)
		clearTimeout(searchTimeout);

	searchTimeout = setTimeout(() => {

		let s = v.trim();
		if (s.length <= 2) s = '';

		if (s != search) {
			search = s;
			fetch({}, true);
		}

	}, SEARCH_TIMEOUT);

});


export async function loadStations() {
	if (loaded) return;

	let stations;

	stations = await api.loadFavouriteStations();
	favourite.set(stations);

	stations = await api.loadRecentStations();
	recent.set(stations);

	loaded = true;
}

export function selectStation(station) {
	selectedView.set(null);
	currentStation.set(station);
}

export function selectView(view) {
	currentStation.set(null);
	selectedView.set(view);
}

export async function updateStation(stationId, data) {
	await api.updateStation(stationId, data);

	updateStore(favourite, stationId, data);
	updateStore(recent, stationId, data);
	updateStore(stations, stationId, data);
}

export function play(station) {
	if (!station.favourite) 
		recent.update(v => [station, ...v.filter(i => i.id != station.id)]);

	playRadio(station);
}

export function toggleFavourite(station) {
	station.favourite = !station.favourite;

	if (get(currentStation)?.id == station.id)
		currentStation.set(station);

	if (get(selectedStation)?.id == station.id)
		selectedStation.set(station);

	if (station.favourite) {
		favourite.update(v => [station, ...v]);
		recent.update(v => v.filter(i => i.id != station.id));
	}
	else {
		favourite.update(v => v.filter(i => i.id != station.id));
		if (station.played_at) {
			recent.update(v => {
				const index = v.findIndex(i => station.played_at < i.played_at);
				if (index != -1) v.splice(index, 0, station);
				else v.push(station);

				return v;
			});
		}
	}

	stations.update(v => {

		const index = v.findIndex(i => i.id == station.id);
		if (index != -1) 
			v.splice(index, 1, station);

		return v;
	});

	api.setStationFavourite(station);
}

function buildQuery(params, lastRequest) { 

	params.query = params.query ?? search;
	params.sort = params.sort ?? get(activeOrder);
	params.favourite = params.favourite ?? false;

	const changed = params.query != lastRequest.query ||
		params.sort != lastRequest.sort ||
		params.favourite != lastRequest.favourite; 

	//console.debug('Query:', changed, params, lastRequest);

	Object.assign(lastRequest, params);
	
	return changed;
}

function updateStore(store, id, data) {
	store.update(stations => {
		const s = stations.find(i => i.id == id);
		if (s) {
			Object.assign(s, data);
		}

		return stations;
	});
}
