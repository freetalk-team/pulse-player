import { writable, get } from "svelte/store";

import { sleep } from "../../utils/sleep";

import { currentRemote } from "../remote";

export const items = writable([]);
export const isLoading = writable(false);
export const hasMore = writable(false);

const LIMIT = 30;
const LOADING_TIMEOUT = 600;

let offset = 0;
let lastRequestId = 0; // 👈 Track the latest request
let fetching = false;

const lastRequest = {};

export async function fetch(collection, query, reset) {

	if (fetching) return;

	const changed = buildQuery(collection, query);

	if (reset) {
		// if (!changed) 
		// 	return;

		offset = query.offset = 0;

		items.set([]);
		hasMore.set(true);
	}

	fetching = true;

	const requestId = ++lastRequestId;
	
	isLoading.set(true);

	try {
		const [newItems] = await Promise.all([
			fetchItems(collection, query),
			sleep(LOADING_TIMEOUT) 
		]);

		if (requestId !== lastRequestId) {
			return; 
		}

		if (newItems.length < LIMIT) 
			hasMore.set(false);
		
		items.update(current => [...current, ...newItems])

		offset += LIMIT;

	} finally {
		if (requestId === lastRequestId) {
			isLoading.set(false);
		}

		fetching = false;
	}

	function buildQuery(collection, params) { 

		params.offset = offset;
		params.limit = LIMIT;


		const changed = params.query != lastRequest.query ||
			params.filter != lastRequest.filter ||
			params.sort != lastRequest.sort ||
			collection != lastRequest.collection;

		//console.debug('Query:', changed, params, lastRequest);

		Object.assign(lastRequest, params, { collection });

		return changed;
	}

	function fetchItems(collection, query) {

		const remote = get(currentRemote).id;

		switch (collection) {

			case 'track':
			return api.queryTracks(query, remote);

			default:
			return api.queryCollections(collection, query, remote);
		}
	}
}