
import { Provider } from "./Provider";

import Countries from '@common/countries.json' with { type: 'json' };

export class RadioBrowserProvider extends Provider {

	static baseUrl = 'https://de1.api.radio-browser.info';

	async queryStations(params) {

		const url = new URL(RadioBrowserProvider.baseUrl);

		url.pathname= '/json/stations/search';

		url.searchParams.append('offset', params.offset);
		url.searchParams.append('limit', params.limit);
		url.searchParams.append('order', 'votes');
		url.searchParams.append('reverse', 'true');

		if (params.query)
			url.searchParams.append('name', params.query);

		let stations = [];

		try {
			console.debug('Fetching stations:', url.toString());

			const res = await fetch(url);

			if (res.ok) {

				stations = await res.json();

				return stations.map(s => ({
					uuid: s.stationuuid,
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

}


/*

changeuuid: 'bcd03dc2-bfc7-4b2b-8af4-5ef687d51e99',
    stationuuid: '960c68f8-0601-11e8-ae97-52543be04c81',
    serveruuid: null,
    name: 'RFI Monde',
    url: 'http://live02.rfi.fr/rfimonde-64.mp3',
    url_resolved: 'http://live02.rfi.fr/rfimonde-64.mp3',
    homepage: 'http://www.rfi.fr/',
    favicon: 'http://www.rfi.fr/apple-touch-icon.png',
    tags: 'news,world music',
    country: 'France',
    countrycode: 'FR',
    iso_3166_2: '',
    state: 'Île-de-France',
    language: 'french',
    languagecodes: 'fr',
    votes: 56401,
    lastchangetime: '2026-01-15 05:24:15',
    lastchangetime_iso8601: '2026-01-15T05:24:15Z',
    codec: 'MP3',
    bitrate: 64,
    hls: 0,
    lastcheckok: 1,
    lastchecktime: '2026-01-15 05:24:16',
    lastchecktime_iso8601: '2026-01-15T05:24:16Z',
    lastcheckoktime: '2026-01-15 05:24:16',
    lastcheckoktime_iso8601: '2026-01-15T05:24:16Z',
    lastlocalchecktime: '2026-01-15 05:24:16',
    lastlocalchecktime_iso8601: '2026-01-15T05:24:16Z',
    clicktimestamp: '2026-07-07 06:20:12',
    clicktimestamp_iso8601: '2026-07-07T06:20:12Z',
    clickcount: 58,
    clicktrend: 58,
    ssl_error: 0,
    geo_lat: null,
    geo_long: null,
    geo_distance: null,
    has_extended_info: false

*/