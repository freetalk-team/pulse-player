import { writable, get } from 'svelte/store';

import { searchQuery, activeOrder } from './selection';
import { fetchCall } from './fetch';

export const collections = writable([]);

export const isLoading = writable(false);
export const hasMore = writable(false);

const fetchCollections = fetchCall(api.queryCollections, collections, isLoading, hasMore, buildQuery);
export const fetch = (collection, reset) => fetchCollections({ collection }, reset);

function buildQuery(params, lastRequest) {

	params.sort = params.sort || get(activeOrder);
	params.query = params.query || get(searchQuery);

	const changed = params.query != lastRequest.query ||
		params.sort != lastRequest.sort ||
		params.collection != lastRequest.collection
		;

	Object.assign(lastRequest, params);

	return changed;
}