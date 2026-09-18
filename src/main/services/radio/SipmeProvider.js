import { Provider } from "./Provider";

import Countries from '@common/countries.json' with { type: 'json' };

export class SipmeProvider extends Provider {

    static baseUrl = import.meta.env.VITE_API_URL + '/api/station';

    async queryStations(params) {
        const url = this.#url();

		url.searchParams.append('offset', params.offset);
		url.searchParams.append('limit', params.limit);

		if (params.query)
			url.searchParams.append('query', params.query);

		let stations = [];

		try {
			console.debug('Fetching stations:', url.toString());

			const res = await fetch(url);

			if (res.ok) {

				stations = await res.json();

				return stations.map(s => ({
					uuid: s.uuid,
					changeid: s.changeuuid.hashCode(),
					name: s.name.length > 80 ? s.name.substr(0, 80) + '...' : s.name,
					url: s.url_resolved || s.url,
					homepage: s.homepage,
					favicon: s.favicon,
					country: s.country,
					countrycode: s.countrycode,
					state: s.state,
					language: s.language,
					tags: s.tags,
					codec: s.codec,
					timezone: Countries[s.countrycode]?.timezones[0]
				}));

			}

		}
		catch (e) {
			console.error('🚨 Failed to fetch stations:', e);
		}

    }

	async setFavourite(uuid) {
		try {
			const url = '/vote/' + uuid;
			const res = await this.#fetch(url, {});
		}
		catch (e) {
			console.error('[SIPME] Failed to set favourite:', e.message);
		}
	}

	#url() {
		return new URL(SipmeProvider.baseUrl);
	}

	#fetch(url, body) {
		if (typeof url == 'string' && url.startsWith('/'))
			url = SipmeProvider.baseUrl + url;

		const headers = { origin: SipmeProvider.baseUrl };
		const opt = { headers };

		if (body) {
			opt.method = 'POST';
			opt.body = JSON.stringify(body);

			headers['content-type'] = 'application/json';
		}

		return fetch(url, opt);
	}
}

