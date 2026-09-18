
import { sleep } from "../utils/sleep";

export const LIMIT = 30;
const LOADING_TIMEOUT = 400;

export function fetchCall(apiCall, items, isLoading, hasMore, buildQuery=defaultBuildQuery) {

	let offset = 0;
	let lastRequestId = 0; // 👈 Track the latest request
	let fetching = false;

	const lastRequest = {};

	async function fetch(query={}, reset) {

		if (fetching) return;

		const changed = buildQuery(query, lastRequest);

		if (reset) {
			if (!changed) 
				return;

			offset = 0;

			items.set([]);
			hasMore.set(true);
		}

		query.limit = query.limit || LIMIT;
		query.offset = offset;

		fetching = true;

		// 1. Generate a unique ID for this specific fetch call
		const requestId = ++lastRequestId;

		isLoading.set(true);

		// console.trace('Fetchig tracks ...');

		try {
			const [newItems] = await Promise.all([
				apiCall(query),
				sleep(LOADING_TIMEOUT) 
			]);

			console.debug('Fetched:', newItems.length);

			// 2. THE FIX: If a newer request has started, discard this one!
			if (requestId !== lastRequestId) {
				// console.log('🚫 Discarding stale search result');
				return; 
			}

			if (newItems.length < LIMIT) 
				hasMore.set(false);
				
			
			// ✅ REASSIGN for reactivity
			items.update(items => {
				const ids = new Set(items.map(i => i.id));
				return [...items, ...newItems.filter(i => !ids.has(i.id))];
			});

			offset += LIMIT;

		} finally {
			// 3. Only stop loading if this is still the active request
			if (requestId === lastRequestId) {
				isLoading.set(false);
			}

			fetching = false;

			// console.log('Fetching done');
		}

		
	}

	return fetch;
}

function defaultBuildQuery(params, last) {
	const changed = !Object.equal(params, last);
	Object.assign(last, params);

	return changed;
}