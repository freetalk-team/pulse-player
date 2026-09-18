import { app, ipcMain } from 'electron';
import { join, isAbsolute } from 'node:path';
import fs from 'fs';
import crypto from 'crypto';

import { WorkerBase } from './worker';

import store from './store';
import lib from './services/library';
import remote from './services/remote';

const THUMBS_DIR = store.thumbDir;
const DATABASE_DIR = store.databaseDir;


class ScanWorker extends WorkerBase {

	#handler;

	constructor(handler) {

		const userDirs = {
			thumbs: THUMBS_DIR,
			database: DATABASE_DIR
		};

		super (join(__dirname, 'scanner.js'), { userDirs });

		this.#handler = handler;
	}

	scan(path) {
		this.post({ type: 'add', path });
	}

	onMessage(msg) {
		switch (msg.type) {

			case 'scan-start':
			console.debug('Scanning started...')
			this.#handler('import-start');
			break

			case 'scan-complete':
			console.debug(`Scan complete. Total files: ${msg.total}`)
			break

			case 'progress':
			console.debug(`Progress: (${msg.processed}/${msg.total})`)

			localThumbPaths(msg.tracks);
			this.#handler('import-progress', msg);
			break

			case 'album': {
				const album = localCoverPath(msg.album);
				album.type = 'album';

				this.#handler('import-album', album);
			}
			break

			case 'done':
			console.debug('Processing done')
			this.#handler('import-end')
			break

			case 'cancelled':
			console.debug('Processing cancelled')
			break

			case 'error':
			console.error('Worker error:', msg.error)
			break
		}
	}
}

class DownloadWorker extends WorkerBase {
	#handler;

	constructor(handler) {

		const userDirs = {
			thumbs: THUMBS_DIR,
			database: DATABASE_DIR
		};

		super (join(__dirname, 'downloader.js'), { userDirs });

		this.#handler = handler;
	}

	downloadAlbum(item, player, opt) {
		this.post({ type: 'DOWNLOAD_ALBUM', item, player, opt });
	}

	downloadPlaylist(item, player, opt) {
		this.post({ type: 'DOWNLOAD_PLAYLIST', item, player, opt });
	}

	downloadTrack(item, player, opt) {
		this.post({ type: 'DOWNLOAD_TRACK', item, player, opt });
	}

	onMessage(msg) {
		switch (msg.type) {

			case 'PROGRESS':
			console.debug('[DOWNLOAD] progress:', msg.status, msg.progress);
			this.#handler('download-progress', {
				progress: msg.progress,
				status: msg.status,
				type: msg.itemType,
				id: msg.itemId,
				remoteId: msg.remoteId
			});

			break;

			case 'COMPLETED':
			switch (msg.itemType) {
				case 'album': {
					const album = localCoverPath(msg.item);
					album.type = 'album';

					this.#handler('import-album', album);

					if (album.tracks?.length > 0) {
						const count = album.tracks.length;

						this.#handler('import-progress', {
							processed: count,
							total: count,
							tracks: localThumbPaths(album.tracks) 
						});
					}
				}
				break;

				case 'playlist': {
					const playlist = msg.item;
					const tracks = playlist.tracks;

					delete playlist.tracks;

					playlist.type = 'playlist';
					playlist.track_count = tracks.length;
					playlist.total_duration = tracks.map(i => i.duration).sum();
					playlist.total_rating = tracks.map(i => i.rating).sum();
					playlist.cover_path = tracks
						.map(i => i.thumb_path)
						.filter(i => !!i)
						.slice(0, 4)
						.join(',');

					localCoverPath(playlist);

					this.#handler('playlist:added', playlist);

					if (tracks.length > 0) {
						const count = tracks.length;

						this.#handler('import-progress', {
							processed: count,
							total: count,
							tracks: localThumbPaths(tracks) 
						});
					}
				}
				break;

				case 'track':
				this.#handler('track:added', localThumbPath(msg.item));
				break;
			}
			break;

			case 'ERROR':
			console.error('[WORKER] error:', msg.message);
			break;
		}
	}
}

export function setupIpcHandlers(handler) {

	const scanner = new ScanWorker(handler);
	const downloader = new DownloadWorker(handler);

	ipcMain.handle('scan-folders', (event, paths) => {

		if (typeof paths == 'string') {
			scanner.scan(paths);
		}
		else if (Array.isArray(paths)) {
			for (const path of paths)
				scanner.scan(path);
		}
	});
	
	ipcMain.handle('download', (event, type, item, opt) => {
		const url = remote.getUrl(item.remote);
		if (!url) {
			return;
		}

		const player = {
			id: item.remote,
			url
		};

		switch (type) {

			case 'album':
			downloader.downloadAlbum(item, player, opt);
			break;

			case 'playlist':
			downloader.downloadPlaylist(item, player, opt);
			break;

			case 'track':
			downloader.downloadTrack(item, player, opt);
			break;

		}
	});
}

function localThumbPath(track) {
	return lib.constructor.localThumbPath(track);
}

function localThumbPaths(tracks) {
	return lib.constructor.localTrackPaths(tracks);
}

function localCoverPath(album) {
	return lib.constructor.localCoverPath(album);
}
