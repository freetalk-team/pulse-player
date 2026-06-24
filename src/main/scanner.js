import { Worker } from 'worker_threads';
import { join } from 'node:path';
import fs from 'fs';
import crypto from 'crypto';
import NodeID3 from 'node-id3';

import { app } from 'electron';

import db from './db';
import store from './store';
import { run } from './component';

const WORKER_PATH = join(__dirname, 'scanner2.js'); 
const COMPONENTS_DESTROY_TIMEOUT = 30000;
const THUMB_DIR = store.thumbDir;


export class Scanner {

	#handler;
	#albums = new Map;

	#worker;
	#idleTimer;

	#components = {
		album: {
			components: null,
			timeout: null
		},

		track: {
			components: null,
			timeout: null
		}
	}

	constructor(handler) {
		this.#handler = handler;
	}

	addFolder(path) {

		this.#startWorker();
		this.#worker.postMessage({ type: 'add', path });
	}

	cancelWork() {
		if (this.#worker) {
			this.#worker.postMessage({ type: 'cancel' })
		}
	}

	async updateTrack(track, { fetchMeta, updateFile, updateDb=true, coverPicture=true }) {

		console.debug('Update track:', track, fetchMeta, updateFile, updateDb);

		if (fetchMeta) {

			const ctx = this.#components.track;

			if (!ctx.components) {
				ctx.components = db.getComponents('track');
			}

			if (ctx.timeout) {
				clearTimeout(ctx.timeout);
				ctx.timeout = null;
			}

			for (const component of ctx.components) {

				console.debug('Executing component:', component.name, component.config);

				try {

					const t = {
						title: track.title,
						artist: track.artist,

						setThumbnail(url) {
							if (!url) return;

							this.thumb = url;
						},

						setGenre(genre) {
							if (!genre) return;

							this.genre = genre;
						},

						setDescription() {

						},
					};

					const a = {
						artist: track.artist,

						setName(name) {
							if (!name) return;

							this.name = name;
						},

						setThumbnail(url) {
							if (!url) return;

							this.thumb = url;
						},

						setYear(year) {
							if (!year) return;

							if (typeof year == 'string')
								year = parseInt(year);

							this.year = year;
						},

						setGenre(genre) {
							if (!genre) return;

							this.genre = genre;
						},

						setDescription() {

						}
					}

					const res = await run(component, { track: t, album: a});

					if (res) {

						const album = a;

						console.debug('Album info:', album);

						if (album.name && album.genre) {
							if (album.thumb)
								album.cover_path = await downloadImage(album.thumb, THUMB_DIR);

							db.addAlbum(album, [{ id: track.id }]);

							track.album = album.name;
							track.albumId = album.id;
							track.genre = album.genre;
							track.thumb_path = album.cover_path;
							track.year = album.year;
						}

						if (t.thumb) 
							track.thumb_path = await downloadImage(t.thumb, THUMB_DIR);
						
						if (t.genre)
							track.genre = t.genre;


						break;
					}
				}
				catch (e) {
					console.error('🚨 Failed to execute component:', component.name, e);
				}
			}
		}

		if (updateDb)
			db.updateTrack(track);

		const canUpdateMeta = track.path.endsWith('.mp3');

		if (canUpdateMeta) {

			const meta = {};
			let update = false;

			if (updateFile) {

				update = true;

				Object.assign(meta, {
					title: track.title,
					artist: track.artist,
					album: track.album,
					genre: track.genre,
					year: track.year?.toString(),
				});

				Object.clean(meta);

				// custom tags
				if (track.tag) {

					meta.TXXX = [
						{
							description: "tag",
							value: track.tag
						}
					];

				}
			}

			if (coverPicture && track.thumb_path) {

				try {
					await addPicture(meta, track.thumb_path);

					update = true;
				}
				catch (e) {
					console.error('🚨 Failed to update file meta info:', e);
				}
			}

			if (update) {
				try {
					NodeID3.update(meta, track.path);
				}
				catch (e) {
					console.error('🚨 Failed to update file meta info:', e);
				}
			}
		}

		return track;

		async function addPicture(meta, path) {
			const coverBuffer = await fs.promises.readFile(path);

			meta.image = {
				mime: 'image/jpeg',
				type: {
					id: 3,
					name: 'front cover'
				},
				description: 'Cover',
				imageBuffer: coverBuffer
			};
		}
	}

	#startWorker() {
		if (this.#worker) {

			if (this.#idleTimer) {
				clearTimeout(this.#idleTimer);
				this.#idleTimer = null;
			}

			return;
		}

		const userDirs = {
			thumbs: THUMB_DIR
		};

		this.#worker = new Worker(WORKER_PATH, { workerData: { userDirs }})

		this.#worker.on('message', (msg) => {

			switch (msg.type) {

				case 'scan-start':
				console.log('Scanning started...')
				this.#handler('import-start');
				break

				case 'scan-complete':
				console.log(`Scan complete. Total files: ${msg.total}`)

				
				break

				case 'progress':
				console.log(`Progress: ${msg.progress}% (${msg.processed}/${msg.total})`)
				// console.log(msg.file)

				this.#addTrack(msg.file)

				this.#handler('import-progress', msg);
				break

				case 'done':
				console.log('Processing done')

				this.#handler('import-end');

				this.#addAlbums();
				this.#scheduleDestroy();
				
				break

				case 'cancelled':
				console.log('Processing cancelled')
				this.#scheduleDestroy()
				break

				case 'error':
				console.error('Worker error:', msg.error)
				break

				case 'idle':
				this.#scheduleDestroy()
				break
			}
		})

		this.#worker.on('exit', () => {
			this.#worker = null
		})
	}

	#scheduleDestroy() {
		clearTimeout(this.#idleTimer)

		this.#idleTimer = setTimeout(() => {
			if (this.#worker) {
				console.log('Destroying idle worker...')
				this.#worker.terminate()
				this.#worker = null
			}
		}, 5000)
	}

	#addTrack(file) {
		db.addTracks([file])

		if (file.albumId) {

			const tracks = this.#albums.get(file.albumId);
			if (tracks)
				tracks.push(file);
			else
				this.#albums.set(file.albumId, [file])
		}
	}

	async #addAlbums() {

		const ctx = this.#components.album;

		if (!ctx.components) {
			ctx.components = db.getComponents('album');
		}
		
		if (ctx.timeout) {
			clearTimeout(ctx.timeout);
			ctx.timeout = null;
		}

		for (const tracks of this.#albums.values()) {

			if (tracks.length < 2) continue;


			tracks.sort((a, b) => a.track_no - b.track_no);

			const coverTrack = tracks.filter(i => i.cover_path || i.thumb_path)[0];

			const album = {
				name: tracks[0].album,
				artist: tracks[0].artist,
				genre: tracks[0].genre,
				year: tracks[0].year,
				track_count: tracks.length,
				total_duration: tracks.map(i => i.diration ?? 0).sum(),
				total_rating: tracks.map(i => i.rating ?? 0).sum(),
				cover_path: coverTrack ? (coverTrack.cover_path || coverTrack.thumb_path) : null
			};

			console.debug('[SCAN] Adding album:', album.name, album.artist);

			if (!(album.name && album.artist && album.year && album.genre && album.cover_path)) {

				for (const component of ctx.components) {

					console.debug('Executing component:', component.name, component.config);

					try {

						const param = {
							name: album.name,
							artist: album.artist,
							genre: album.genre,
							year: album.year,

							setThumbnail(thumb) {
								if (!thumb) return;

								this.thumb = thumb;
							},

							setYear(year) {
								if (!year) return;

								if (typeof year == 'string')
									year = parseInt(year);

								this.year = year;
							},

							setGenre(genre) {
								if (!genre) return;

								this.genre = genre;
							},

							setDescription() {

							}
						};

						const res = await run(component, { album: param });

						if (res) {

							if (param.thumb) 
								album.cover_path = await downloadImage(param.thumb, THUMB_DIR);
							
							if (param.genre)
								album.genre = param.genre;

							if (param.year)
								album.year = param.year;

							break;
						}
					}
					catch (e) {
						console.error('🚨 Failed to execute component:', component.name, e);
					}
				}
			}

			db.addAlbum(album, tracks);

			this.#handler('import-album', album);

			ctx.timeout = setTimeout(() => {

				ctx.components = null;
				ctx.timeout = null;

			}, COMPONENTS_DESTROY_TIMEOUT);
		}

		this.#albums.clear();
	}
}

async function downloadImage(url, dir) {
	const hash = hashUrl(url);

	let ext = getExtFromUrl(url);

	// If we have extension → try fast path
	if (ext) {
		const filePath = join(dir, `${hash}.${ext}`);

		if (fs.existsSync(filePath)) {
			return filePath; // ✅ already cached
		}
	}

	// Otherwise fetch (or fallback case)
	const res = await fetch(url, { redirect: 'follow' });

	if (!res.ok) 
		throw new Error(`Failed: ${res.status}`);

	const contentType = res.headers.get('content-type');
	if (!contentType || !contentType.startsWith('image/'))
		throw new Error(`Not an image: ${contentType}`);

	// If extension was missing or unreliable → detect from headers
	if (!ext) {
		const contentType = res.headers.get('content-type') || '';

		const map = {
			'image/jpeg': 'jpg',
			'image/png': 'png',
			'image/webp': 'webp',
			'image/gif': 'gif',
		};

		ext = map[contentType] || 'bin';
	}

	const filePath = join(dir, `${hash}.${ext}`);

	// Double-check (race condition safe)
	if (fs.existsSync(filePath)) {
		return filePath;
	}

	const buffer = Buffer.from(await res.arrayBuffer());
	await fs.promises.writeFile(filePath, buffer);

	return filePath;

	function hashUrl(url) {
		return crypto.createHash('sha1').update(url).digest('hex');
	}

	function getExtFromUrl(url) {
		try {
			const pathname = new URL(url).pathname;
			const ext = pathname.split('.').pop().toLowerCase();

			// basic sanity check
			if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
				return ext === 'jpeg' ? 'jpg' : ext;
			}
		} catch {}

		return null;
	}
}