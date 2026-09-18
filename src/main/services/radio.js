import { join, parse } from 'node:path';

import Countries from '../../common/countries.json' with { type: 'json' };

import store from '../store';
import { events } from "../events";

import { RadioDatabase } from "../db/radio";
import { Image } from '../utils/image';
import { RecordingScheduler } from '../utils/recording-scheduler';
import { RadioBrowserProvider } from './radio/RadioBrowserProvider';
import { SipmeProvider } from './radio/SipmeProvider';

import ffmpeg from '@freetalk-team/pulse-player-ffmpeg';

const SUPPORTED_CODECS = ['mp3', 'ogg', 'flac', 'aac', 'aac+'];

class RadioService {

	static instance = new RadioService;

	#db = new RadioDatabase;
	#recordings = new Map;
	#scheduler = new RecordingScheduler(this);
	#provider;

	init() {
		this.#db.init(store);

		const api = store.registerListener('radio.api', this);
		this.#setProvider(api);

		const recordings = this.#db.getAllRecordings();
		this.#scheduler.init(recordings);
	}

	destroy() {
		this.#db.close();

		for (const [,r] of this.#recordings) {
			try { 
				ffmpeg.stopRecording(r.recid);
			}
			catch (e) {}
		}
	}

	onPrefChange(key, value) {
		switch (key) {
			case 'radio.api':
			this.#setProvider(value);
			break;
		}
	}

	getFavourite() {
		const stations = this.#db.getFavourite();
		return this.#localThumbPaths(stations);
	}

	getRecent() {
		const stations = this.#db.getRecent();
		return this.#localThumbPaths(stations);
	}

	setFavourite(uuid, favourite) {
		this.#db.setFavourite(uuid, favourite);

		if (favourite) {
			this.#provider.setFavourite(uuid);
		}
	}

	updateLastPlayed(id) {
		this.#db.updateLastPlayed(id);
	}

	async queryStations(params, remote) {

		console.debug('[RADIO] query:', params);

		let stations = [];

		params.query = params.query?.trim() || '';
		params.offset = params.offset || 0;
		params.limit = params.limit || 50;

		try {

			if (params.favourite) {
				stations = this.#queryLocalStations(params);
			}
			else {
				const cache = this.#db.getSearchCache(params.query);

				if (!cache || isExpired(cache.last_updated, 7)) {
					stations = await this.#queryStations(params, 0);
				}
				else {

					stations = this.#queryLocalStations(params);

					if (stations.length < params.limit && cache.more) {

						// const more = await this.#queryStations(params, cache.offset);

						// stations.push(...more.slice(0, params.limit - stations.length));
						stations = await this.#queryStations(params, cache.offset);
					}
				}
			}
		}
		catch (e) {
			console.error('🚨 [RADIO] Failed to query:', e);
		}

		return remote 
			? remoteFaviconPaths(stations)
			: stations;
	}

	startRecording(id, meta) {
		if (this.#recordings.has(id)) {
			console.debug('[RADIO] recording already in progress:', id);
			return;
		}

		const station = this.#db.find(id);
		if (!station) {
			console.error('[RADIO] station not exists:', id);
			return;
		}

		localFaviconPath(station);

		const codec = station.codec?.toLowerCase();

		if (!SUPPORTED_CODECS.includes(codec)) {
			console.error('[RADIO] cannot start recording for station with unknown codec:', id, codec);

			events.emit('error', `Codec not supported: ${codec}`);
			return;
		}

		const opt = store.get('dir.recording');
		const addThumb = store.get('radio.addThumb');
		//console.debug('Recording options:', opt);

		//const opt = store.get('dir.recording');
		const outputFilenamePattern = join(opt.rootDir, opt.subdirPattern, opt.filenamePattern);
		const ext = guessExtension(codec);
		const filename = station.name.normalizeFilename() || 'recording';

		const outputFilename = outputFilenamePattern
			.replace('[STATION]', filename)
			.replace('[TIME]', Date.nowDTI()) 
			+ ext;

		if (!meta) 
			meta = { title: station.name, artist: 'Pulse Player' };

		if (addThumb && station.favicon)
			meta.cover = station.favicon;

		console.debug('[RADIO] starting recording:', meta);

		try {
			const rec = ffmpeg.startRecording(station.url, outputFilename, meta);

			station.recid = rec.id;
			station.startTime = Date.now();
			station.path = outputFilename;

			this.#recordings.set(id, station);

			events.emit('recording:started', station);

			return rec.id;
		}
		catch (e) {
			console.error('[RADIO] failed to start recording:', id, e.message);

			events.emit('error', e.message);
		}

		function guessExtension(codec) {
			let ext = codec.toLowerCase();

			if (ext.startsWith('aac'))
				ext = 'm4a';

			return '.' + ext;
		}
	}

	stopRecording(id) {
		const s = this.#recordings.get(id);
		if (!s) {
			console.error('[RADIO] attempt to stop no-existing recording:', id);
			return;
		}

		this.#recordings.delete(id);

		const recid = s.recid;
		const duration = Math.floor((Date.now() - s.startTime) / 1000);

		s.duration = duration;

		try { 

			ffmpeg.stopRecording(recid);

			events.emit('recording:ended', s);

		}
		catch (e) {
			console.error('[RADIO] failed to stop recording:', id, e.message);
		}
	}

	addRecording(recording) {
		const id = this.#db.addRecording(recording);
		if (!id) return;

		recording.id = id;
		recording.is_active = true;

		this.#scheduler.addSchedule(recording);

		return id;
	}

	removeRecording(id) {
		this.#db.removeRecording(id);
		this.#scheduler.removeSchedule(id);
	}

	async #queryStations(params, offset) {

		const stations = await this.#provider.queryStations({ 
			...params,
			offset, 
			limit: 50
		});

		if (stations) {
			this.#db.updateSearchCache(
				params.query, 
				offset + stations.length, 
				stations.length >= params.limit
			);

			await this.#saveStations(stations);
		}

		return this.#queryLocalStations(params);
	}

	#queryLocalStations(params) {
		return this.#localThumbPaths(this.#db.query(params));
	}

	async #saveStations(stations) {

		// console.debug('Fetched stations:', stations);

		const thumbDir = store.thumbRadioDir;

		for (const s of stations) {

			if (!s.codec || s.code == 'UNKNOWN') {

				const url = URL.parse(s.url);
				if (url) {
					const ext = parse(url.pathname);
					s.codec = ext?.substr(1).toUpperCase();
				}
			}

			if (s.favicon) {

				try {
					s.favicon = await Image.downloadThumb(s.favicon, thumbDir);
				}
				catch (e) {
					console.debug('🚨 Failed to download favicon:', e.message);
					s.favicon = null;
				}
			}
		}

		this.#db.add(stations);

		// return this.#localThumbPaths(newStations);

	}

	#setProvider(api) {
		console.debug('Setting provider:', api);

		switch (api) {
			case 'radio-browser':
			this.#provider = new RadioBrowserProvider;
			break;

			case 'sipme':
			this.#provider = new SipmeProvider;
			break;
		}

	}
	
	#getRecordings() {
		const recordings = this.#db.getAllRecordings();
		return this.#localThumbPaths(recordings);
	}

	#setRecordingActive(id, active) {
		this.#db.updateRecording(id, { is_active: active });
		this.#scheduler.setActive(id, active);
	}

	#localThumbPaths(stations) {
		const thumbDir = store.thumbRadioDir;

		for (const s of stations) 
			localFaviconPath(s, thumbDir);
		
		return stations;
	}

	registerHandlers(ipc) {
		ipc.handle('get-favourite-stations', (event) => this.getFavourite());
		ipc.handle('get-recent-stations', (event) => this.getRecent());
		ipc.handle('query-stations', (event, params) => this.queryStations(params));
		ipc.handle('set-station-favourite', (event, uuid, favourite) => this.setFavourite(uuid, favourite));
		ipc.handle('update-station', (event, id, data) => this.#db.update(id, data));
		ipc.handle('update-last-played-station', (event, id) => this.updateLastPlayed(id));

		ipc.handle('start-recording', (event, id) => this.startRecording(id));
		ipc.handle('stop-recording', (event, id) => this.stopRecording(id));
		ipc.handle('add-recording', (event, recording) => this.addRecording(recording));
		ipc.handle('remove-recording', (event, id) => this.removeRecording(id));
		ipc.handle('get-recordings', (event, id) => id
			? this.#db.getRecordings(id)
			: this.#getRecordings()
		);
		ipc.handle('set-recording-active', (event, id, active) => this.#setRecordingActive(id, active));
	}
}

function localFaviconPath(s, thumbDir=store.thumbRadioDir) {
	if (s.favicon)
		s.favicon = join(thumbDir, s.favicon);
}

function remoteFaviconPaths(stations, thumbDir=store.thumbDir) {
	for (const i of stations) {
		if (i.favicon) 
			i.favicon = i.favicon.startsWith(thumbDir) 
				? '/thumb' + i.favicon.substr(thumbDir.length) 
				: null;
	}
	
	return stations;
}

function isExpired(date, days) {
	if (typeof date == 'string')
		date = new Date(date);

	return Date.now() - date.getTime() > days * 24 * 60 * 60 * 1000;
}

export default RadioService.instance;

/*

import ffmpeg from 'ffmpeg-static'
import { spawn } from 'child_process'

const proc = spawn(ffmpeg, [
  '-re',
  '-i', trackPath,

  '-f', 'mp3',
  '-b:a', '192k',

  'pipe:1'
])

proc.stdout.on('data', chunk => {
  clients.forEach(res => res.write(chunk))
})

*/