import db from './db'
import events from './events';
import scanner from './scanner';

const API_URL = import.meta.env.VITE_API_URL || '';

const SAVE_PREFS_TIMEOUT = 5000;
const STATION_SEARCH_TIMEOUT = 7 * 24 * 60 * 60;

const prefs = loadPrefs();
const sortKeys = { created: 'created_at', recent: 'played_at', rating: 'rating' };

let savePrefsTimeout;

const api = {
	on: (channel, func) => events.on(channel, func)

	, dialogOpenFile(defaultPath) {
		return showOpenFilePicker({
			multiple: true,
			startIn: 'music',
			types: [
				{
					description: 'Audio tracks',
					accept: {
						"audio/*": [".mp3", ".ogg", ".flac", ".m4a", ".mp4"],
					},
				},
				{
					description: 'Video clips',
					accept: {
						"video/*": [".mp4", ".mkv", ".webm"],
					},
				}
			]
		});
	}

	, dialogOpenDirectory(defaultPath) {
		return showDirectoryPicker({
			startIn: 'music',
			mode: 'read' // 'readwrite'
		});
	}

	, scanFolders(handles) {
		console.debug('API scan folders:', handles);

		scanner.scan(Array.isArray(handles) ? handles : [handles]);
	}

	, async getLibraryStat() {

		const audioTracks = await db.count('track', 'type', 'audio');
		const videoTracks = await db.count('track', 'type', 'video');
		const albums = await db.count('collection', 'type', 'album');
		const playlists = await db.count('collection', 'type', 'playlist');
		const playset = await db.count('playset');

		console.debug(`Library: audio=${audioTracks}, albums=${albums}`);

		return {
			audio_count: audioTracks,
			video_count: videoTracks,
			album_count: albums,
			playlist_count: playlists,
			playset_count: playset
		}
	}

	, async getGenres() {
		return ['Rock', 'Pop', 'Jazz'];
	}

	, async queryTracks(params) {

		console.debug('QUERY tracks:', params);

		const keys = [], values = [];

		if (['audio', 'video'].includes(params.filter)) {
			keys.push('type');
			values.push(params.filter);
		}

		const sort = sortKeys[params.sort];

		keys.push(sort);

		const start = [...values, Number.MIN_SAFE_INTEGER];
		const end = [...values, Number.MAX_SAFE_INTEGER];
		const range = [getIndex(start), getIndex(end)];
		const index = keys.join('_');
		const offset = params.offset || 0;
		const limit = params.limit ?? 30;

		// console.debug('Query tracks:', index, start, end);

		return params.query?.length > 2
			? db.search('track', params.query, index, range, true, offset, limit)
			: db.lsByRange('track', index, range, true, offset, limit);
			
	}

	, getRecentTracks() { 
		return db.lsByRange('track',
			'played_at',
			[0, Number.MAX_SAFE_INTEGER],
			true,
			0, 200
		);
	}

	, updateLastPlayedTrack(track) {
		return db.update('track', track.id, 
			{ 
				played_at: Date.now(),
				rating: track.rating < 0 ? 1 : track.rating + 1
			});
	}

	, removeTrack(id) {
		return db.rm('track', id);
	}

	, async updateLastPlayed() {}



	// albums
	, async queryAlbums(query) { return queryCollection('album', query); }
	, async getAlbums()        { return getCollectionRecent('album'); }
	, async getAlbumTracks(id) { return getCollectionTracks(id); } 
	, async deleteAlbum(id) { return db.rm('collection', id); }

	// playlists
	, async queryPlaylists(query) { return queryCollection('playlist', query); }
	, async getPlaylists()        { return getCollectionRecent('playlist'); }
	, async getPlaylistTracks(id) { return getCollectionTracks(id); }

	, async createPlaylist(playlist) {
		const { tracks, ...data } = playlist;
		const [ total_duration, total_rating ] = tracks 
			? [ tracks.map(i => i.duration).sum(), tracks.map(i => i.rating).sum()]
			: [0, 0];

		const [id] = await db.add('collection', { type: 'playlist', ...data,
			played_at: 0,
			created_at: Date.now(),
			track_count: tracks.length,
			total_duration,
			total_rating
		});


		if (tracks) {
			const order = tracks.map((track, position) => ({ 
				collection_id: id, 
				track_id: track.id, 
				position 
			}));

			await db.put('collection_tracks', order);
		}

		return id;
	}

	, async deletePlaylist(id) { return db.rm('collection', id); }

	, async updatePlaylist(id, data) {
		await db.update('collection', id, data);
	}

	, async updatePlaylistOrder(id, tracks, startIndex) {
		// console.debug('Update playlist order:', order);

		const purge = startIndex < 0;

		if (purge) {
			
			await db.rmByIndex('collection_tracks', 'collection_id', id);

			const order = tracks.map((i, index) => ({
				collection_id: id,
				track_id: i.id,
				position: index
			}));

			await db.add('collection_tracks', order);
			await db.update('collection', id, { 
				track_count: tracks.length,
				total_rating: tracks.map(i => i.rating).sum(),
				total_duration:  tracks.map(i => i.duration).sum()
			});
		}
		else {
			const playlist = await db.get('collection', id);

			const order = tracks.map((track, position) => ({ 
				collection_id: id, 
				track_id: track.id, 
				position: startIndex + position
			}));

			await db.add('collection_tracks', order);
			await db.update('collection', id, { 
				track_count: playlist.track_count + tracks.length,
				total_rating: playlist.total_rating + tracks.map(i => i.rating).sum(),
				total_duration: playlist.total_duration + tracks.map(i => i.duration).sum()
			});

		} 
	
	}

	// playsets
	, async queryPlaysets(query) {
		return db.lsByRange('playset', 
			sortKeys[query.sort], 
			[0, Number.MAX_SAFE_INTEGER],
			true,
			query.offset, query.limit
		);

	}
	, async getPlaysets()        { 
		return db.lsByRange('playset', 
			'played_at', 
			[ 0, Number.MAX_SAFE_INTEGER],
			true,
			0, 16);
	}
	, async getPlaysetMembers(id) {
		const row = await db.get('playset_members', id);
		return db.getMany('collection', row.members);
	}

	, async createPlayset(playset) {
		const { members, ...data } = playset;
		const [ total_duration, total_rating ] = members 
			? [ members.map(i => i.total_duration).sum(), members.map(i => i.total_rating).sum()]
			: [0, 0];

		const id = Date.now();

		await db.put('playset', { type: 'playset', ...data,
			id,
			played_at: 0,
			created_at: Date.now(),
			total_duration,
			total_rating
		});

		if (members) {
			const order = members.map((member, index) => ({
				playset_id: id,
				member_id: member.id,
				position: index
			}));

			await db.put('playset_members', order);
		}

		return id;
	}

	, async deletePlayset(id) { return db.rm('playset', id); }

	, async updatePlayset(id, data) {
		await db.update('playset', id, data);
	}

	, async updatePlaysetOrder(id, members, startIndex) {

		const purge = startIndex < 0;

		if (purge) {
			
			await db.rmByIndex('playset_members', 'playset_id', id);

			const order = members.map((i, index) => ({
				playset_id: id,
				member_id: i.id,
				position: index
			}));

			await db.add('playset_members', order);
			await db.update('playset', id, { 
				member_count: members.length,
				total_rating: members.map(i => i.total_rating).sum(),
				total_duration:  members.map(i => i.total_duration).sum()
			});
		}
		else {
			const playset = await db.get('playset', id);

			const order = members.map((i, index) => ({
				playset_id: id,
				member_id: i.id,
				position: index + startIndex
			}));

			await db.add('playset_members', order);
			await db.update('playset', id, { 
				member_count: playset.member_count + members.length,
				total_rating: playset.total_rating + members.map(i => i.total_rating).sum(),
				total_duration: playset.total_duration + members.map(i => i.total_duration).sum()
			});
		} 
	}

	// collections
	, async queryCollections(query) {
		console.debug('API query collections:', query);

		if (typeof query.collection == 'number') {
			const playset_id = query.collection;
			const members = await db.lsByRange(
				'playset_members', 
				'member_position',
				[ [playset_id, 0], [playset_id, Number.MAX_SAFE_INTEGER] ],
				false,
				query.offset,
				query.limit
			);

			const ids = members.map(i => i.member_id);

			return members.length > 0
				? db.getMany('collection', ids)
				: [];
		}

		return db.lsByRange('collection', 
			sortKeys[query.sort], 
			[0, Number.MAX_SAFE_INTEGER],
			true,
			query.offset, query.limit);
	}

	// stations
	, async queryStations(params) {

		let stations, index, range;

		const query = params.query?.normalizeSearch() || '';
		const now = Date.seconds();

		switch (params.sort) {

			case 'favourite':
			index = 'favourite_rating';
			range = [ [ 0, 0 ], [ 1, Number.MAX_SAFE_INTEGER ] ];
			break;

			default:
			index = params.sort;
			range = [0, Number.MAX_SAFE_INTEGER];
			break;
		}

		const cache = await db.find('station_search', 'query', query);

		// console.debug('Cache:', cache, cache.ts + STATION_SEARCH_TIMEOUT, now);

		if (cache && cache.ts + STATION_SEARCH_TIMEOUT > now) {

			stations = query
				? await db.search('station', 
					query, 
					index,
					range,
					true,
					params.offset, params.limit
				)
				: await db.lsByRange('station',
					index,
					range,
					true,
					params.offset, params.limit
				);

			if (stations.length < params.limit && cache.more) {
				const newStations = await queryStations({ 
					...params,
					offset: cache.offset
				});

				const update = newStations.length < params.limit
					? { ts: now, more: false }
					: { ts: now, more: true, offset: cache.offset + newStations.length };

				await db.update('station_search', cache.id, update);

				stations.push(...newStations.slice(0, params.limit - stations.length));
			}
		}
		else {
			stations = await queryStations(params);

			const offset = stations.length;
			const more = stations.length >= params.limit;

			if (cache) {
				await db.put('station_search', { 
					id: cache.id,
					query, 
					ts: now,
					offset, 
					more
				});
			}
			else {
				if (!query && params.offset == 0 && stations.length == 0) {
					// todo: report error
				}
				else {

					await db.add('station_search', { 
						query, 
						ts: now,
						offset, 
						more
					});
				}
			}
		}

		// console.debug("Loaded stations:", stations);

		return stations;
	}

	, async loadFavouriteStations() {
		return db.lsByIndex('station', 'favourite', 1, 0, 100);
	}

	, async loadRecentStations() {
		return db.lsByRange('station', 
			'recent', 
			[1000000,  Number.MAX_SAFE_INTEGER],
			true,
			0, 100
		);
	}

	, async updateLastPlayedStation(station) {
		await db.update('station', 
			station.id, 
			{ played_at: Date.seconds() }, 
			station
		); 
	}

	, async setStationFavourite(station) {

		station.favourite = station.favourite ? 1 : 0;

		await db.update('station', 
			station.id, 
			{ favourite: station.favourite }, 
			station
		); 

		try {

			if (station.favourite) {
				const url = API_URL + '/api/station/vote/' + station.uuid;
			
				await fetch(url, { method: 'POST' });
			}
			
		}
		catch (e) {
			console.error('Failed to set favourite station:', e.message);
		}

	}

	, getPrefs() {
		return prefs
	}

	, getPref(key, defaultValue) {
		const parts = key.split('.');
		let obj = prefs;

		for (const p of parts) {
			if (obj == null || typeof obj !== 'object' || !(p in obj)) {
				return defaultValue;
			}

			obj = obj[p];
		}

		return obj;
	}

	, setPref(key, value) {
		console.debug('[PREF]', key, value);

		if (typeof key == 'string') {

			const parts = key.split('.');
			let obj = prefs;

			for (let i = 0; i < parts.length - 1; i++) {
				const p = parts[i];

				if (typeof obj[p] !== 'object' || obj[p] === null) {
					obj[p] = {};
				}

				obj = obj[p];
			}

			obj[parts[parts.length - 1]] = value;

		}
		else {
			for (const [k, v] of Object.entries(key))
				prefs[k] = v;
		}

		if (savePrefsTimeout)
			clearTimeout(savePrefsTimeout);

		savePrefsTimeout = setTimeout(() => {

			localStorage.setItem('prefs', JSON.stringify(prefs));
			savePrefsTimeout = null;

		}, SAVE_PREFS_TIMEOUT);
	}
}

async function queryCollection(collection, query) {
	const keys = ['type'], values = [collection];
	const sort = sortKeys[query.sort];

	keys.push(sort);

	const start = [...values, 0];
	const end = [...values, Number.MAX_SAFE_INTEGER];

	const index = keys.join('_');

	console.debug('Query collection:', index, start, end);

	return db.lsByRange('collection', 
		index, 
		[getIndex(start), getIndex(end)],
		true,
		query.offset, query.limit
	);
}

async function getCollectionTracks(id) {
	const order = await db.lsByRange(
		'collection_tracks',
		'track_position',
		[ [id, 0], [id, Number.MAX_SAFE_INTEGER] ],
		false,
		0,
		1000
	);

	const tracks = order.map(i => i.track_id);

	return db.getMany('track', tracks);
}

async function getCollectionRecent(type, limit=16) {
	return db.lsByRange('collection', 
		'type_played_at', 
		[ [type, 0], [type, Number.MAX_SAFE_INTEGER] ],
		true,
		0, limit); 
}

async function fetchStations(params) {

	// const url = new URL(API_URL);

	// url.pathname = '/api/station';
	// url.searchParams.append('offset', params.offset);
	// url.searchParams.append('limit', params.limit);

	// if (params.query)
	// 	url.searchParams.append('query', params.query);

	console.debug('Fetching stations:', params);

	const url = API_URL + '/api/station/web';
	const sp = new URLSearchParams();

	sp.append('offset', params.offset);
	sp.append('limit', params.limit);

	if (params.query)
		sp.append('query', params.query);

	try {

		const res = await fetch(`${url}?${sp.toString()}`);

		if (res.ok)
			return res.json();

	}
	catch (e) {
		console.error('Failed to fetch stations:', e.message);
	}

	return [];
}

async function queryStations(params) {

	const stations = await fetchStations(params);

	if (stations.length > 0) {

		stations.forEach(s => {
			s.favourite = 0;
			s.played_at = 1000 - s.id > 0 ? 1000 - s.id : 0;
			s.fts = createFTSIndex(s);
		});

		await db.upsert('station', stations, (existing, data) => {
			existing.url = data.url;
			existing.favicon = data.favicon;

			return existing;
		});
	}

	return stations;

	function createFTSIndex(station) {
    
		// Combine all searchable fields
		const search = [ station.name ];

		if (station.country) search.push(station.country);
		if (station.countrycode) search.push(station.countrycode);
		if (station.tags) search.push(station.tags);

		const searchText = search.join(' ').trim();
		
		// Generate tokens
		const tokens = db.tokenize(searchText);
		
		// Store tokens as a separate property
		return tokens;
    }
}


function getIndex(idx) {
	return Array.isArray(idx) 
		? idx.length == 1 ? idx[0] : idx
		: idx;
}

function loadPrefs() {
	let prefs = localStorage.getItem('prefs');

	if (prefs) {
		prefs = JSON.parse(prefs);
	}
	else {
		prefs = {
			ui: {
				lastLayout: 'radio'
			}
		}
	}

	return prefs;
}

window.api = api;
window.isElectron = false;

/* 

Re-request directory permission if directory handle is in database

const library = await getLibrary();

const permission = await library.directoryHandle.queryPermission({
	mode: 'read'
});

*/