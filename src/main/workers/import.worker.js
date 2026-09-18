import { parentPort, workerData } from 'node:worker_threads';

import fs from 'node:fs/promises';
import { existsSync as fileExists, stat } from 'node:fs';
import { basename, join } from 'node:path';


import '../../common/string';
import '../../common/object';

import { Track } from '../utils/track';
import { Image } from '../utils/image';
import Youtube from '../utils/youtube';
import { LibraryDatabase } from '../db/library';
import { AlbumComponents } from '../components/album';

const { userDirs } = workerData;

const THUMBS_DIR = userDirs.thumbs;
const DATABASE_DIR = userDirs.database;

const library = LibraryDatabase.create(DATABASE_DIR);

// --- CONFIG ---
const CONCURRENCY = 2

// --- STATE ---
const state = {
	queue: [],
	processing: false,
	scanning: 0,
	canceled: false,

	total: 0,
	processed: 0,
	imported: 0,
	skipped: 0,
	errors: 0,

	albums: new Map(),
	thumbs: new Set(),

	pending: [],
};

let components;

const isImage = (name) => /\.(jpg|jpeg|png)$/i.test(name)
const hasMeta = (name) => /\.(mp3|flac|ogg|mp4|wav|aiff)$/i.test(name)

// --- MESSAGE HANDLER ---
parentPort.on('message', async (msg) => {

	if (typeof msg == 'string') {

		switch (msg) {

			case 'SHUTDOWN':
			library.close()
			process.exit(0)
			break;

			case 'CANCEL':
			state.canceled = true
			break;

		}

		return;
	}

	if (msg.type === 'add') {
		processPaths(Array.isArray(msg.path) ? msg.path : [msg.path]);
	}
})

async function processPaths(paths) {

	parentPort.postMessage({ type: 'scan-start' })

	state.scanning++;

	console.debug('[IMPORTER] add files:', paths.length);

	const parent = createDirectoryState();

	try {
		for (const p of paths) {
			for await (const item of walk(p, parent)) {

				state.queue.push(item);
				state.total++;

			}
		}
	} finally {
		state.scanning--;

		parentPort.postMessage({
			type: 'scan-complete',
			total: state.total
		});

		processQueue();
	}
}

async function* walk(entry, parent) {

	let path;

	if (typeof entry == 'string') {
		path = entry;
		entry = await fs.stat(entry);
	}
	else {
		path = join(entry.parentPath, entry.name);
	}

	if (entry.isFile()) {
		if (Track.isMedia(path)) {
			parent.totalFiles++;

			yield {
				path,
				parent,
			};


		}
		else if (isImage(path)) {
			parent.images.push(path);
		}

		return;
	}


	if (!entry.isDirectory())
		return;

	const directory = createDirectoryState(parent);

	let entries;

	try {
		entries = await fs.readdir(path, { withFileTypes: true });
	} catch (err) {
		parentPort.postMessage({ type: 'error', error: err.message });
		return;
	}

	for await (const e of entries) {
		yield* walk(e, directory);
	}

}


async function processQueue() {
	if (state.processing) {
		return;
	}

	state.processing = true;

	try {

		while (state.queue.length > 0) {
			const item = state.queue.shift();

			await processFile(item);
		}
	} finally {
		state.processing = false;

		//postProgress();

		checkComplete();
	}
}

async function processFile(item) {
	const directory = item.parent;

	let track;

	try {

		track = Track.meta(item.path);

		if (track.cover?.data.length > 512) {
			const ext = track.cover.mime === 'image/png' ? 'png' : 'jpg';
			const filename = `${track.cover.hash.toString(16)}.${ext}`;
			const path = join(userDirs.thumbs, filename);
			const exists = fileExists(path);

			if (!exists)
				await fs.writeFile(path, track.cover.data);

			track.thumb_path = filename;

			delete track.cover;
		}

		if (!track.artist) {
			if (track.type == 'video') {

				const youtubeId = Youtube.getId(track.path);
				if (youtubeId) {

					const meta = await Youtube.getMeta(youtubeId);
					if (meta) {
						track.title = meta.title;
						track.artist = meta.artist;

						const filename = await Image.downloadThumb(meta.cover, THUMBS_DIR);
						track.thumb_path = filename;

						const path = join(THUMBS_DIR, filename);
						meta.image = { path };

						Track.update(track.path, meta);
					}
				}

				if (!track.thumb_path) {
					const filename = `${track.hash}.jpg`;
					const outputPath = join(THUMBS_DIR, filename);

					const exists = fileExists(outputPath);

					console.debug('Generating video thumb:', outputPath);

					if (exists) {
						track.thumb_path = filename;
					}
					else {

						if (Track.generateThumb(track.path, outputPath)) {
							console.debug('Generated vide thumb:', outputPath);
							track.thumb_path = filename;
						}
					}
				}
			}
		}

		if (!track.size) {
			const stat = await fs.stat(item.path);
			track.size = stat.size;
		}


		directory.tracks.push(track);
		state.imported++;


	}
	catch (error) {
		console.error(`Failed to parse ${item.path}`, error);

		directory.failedFiles++;
		state.errors++;
	}
	finally {
		directory.parsedFiles++;
		state.processed++;
	}

	await processDirectory(directory);
}

async function processDirectory(dir) {

	const track = dir.tracks[dir.tracks.length - 1];

	if (dir.albumChecked || dir.totalFiles < 3) {
		// report progress
		library.addTrack(track);

		return reportProgress(track);
	}

	const album = normalize(track.album);
	const artist = normalize(track.artist);

	if (dir.parsedFiles == 1) {


		if (!check(artist, album)) {
			dir.albumChecked = true;

			library.addTrack(track);

			return reportProgress(track);
		}

		dir.album = album;
		dir.artist = artist;
		dir.genre = track.genre;
		dir.cover = track.thumb_path;
		dir.year = track.year;
	}
	else {


		if (!check(artist, album)) {
			dir.albumChecked = true;

			library.addTracks(dir.tracks);

			return reportProgress(dir.tracks);
		}

		dir.genre = dir.genre || track.genre;
		dir.cover = dir.cover || track.thumb_path;
		dir.year = dir.year || track.year;

		if (dir.parsedFiles == dir.totalFiles) {

			console.debug('Process directory:', {
				id: dir.id,
				parentid: dir.parent?.id,
				totalFiles: dir.totalFiles,
				track0: dir.tracks[0]
			});

			await createAlbum(dir);

			return reportProgress(dir.tracks);
		}
	}

	function normalize(value) {
		return (value ?? '')
			.trim()
			.replace(/\s+/g, ' ')
			.toLocaleLowerCase();
	}

	function check(artist, album) {
		return artist && 
			album && 
			Track.isValidArtist(artist) && 
			Track.isValidAlbum(album);
	}
} 

async function createAlbum({ album, artist, genre, year, cover, tracks }) {

	if (!cover) {
		if (!components)
			components = new AlbumComponents(DATABASE_DIR);

		const res = await components.fetchMeta({
			name: album,
			artist,
			genre,
			year
		}, THUMBS_DIR);

		console.debug('[META] response:', res);

		cover = res.cover;
		genre = genre || res.genre;
		year = year || res.year;

		for (const i of tracks) {
			i.thumb_path = cover;
			i.genre = genre;
		}
	}

	tracks.sort((a, b) => a.no && b.no ? a.no - b.no : -1);

	const a = library.addAlbum({
		name: album.titleCase(),
		artist: artist.titleCase(),
		genre,
		year,
		cover_path: cover
	}, tracks, true);

	if (!a.existing) {
		// report album

		a.track_count = tracks.length;
		a.total_rating = tracks.map(i => i.rating).sum();
		a.total_duration = tracks.map(i => i.duration).sum();

		parentPort.postMessage({
			type: 'album',
			album: a,
		});
	}
}

function createDirectoryState(parent=null) {
	const id = crypto.randomUUID();

	const directory = {
		id,
		parent,

		totalFiles: 0,
		parsedFiles: 0,
		failedFiles: 0,

		scanComplete: false,
		albumChecked: false,

		tracks: [],
		images: []
	};

	// console.debug('Directory:', directory);

	return directory;
}

function reportProgress(tracks) {

	if (!tracks) {

		if (state.pending.length > 0) {
			report(state.pending);
			state.pending = [];
		}

		return;
	}
	
	const reportCount = Math.ceil(state.total / 100)

	if (Array.isArray(tracks)) {
		if (tracks.length >= reportCount) {
			report(tracks);
			return;
		}

		state.pending.push(...tracks);
	}
	else {
		state.pending.push(tracks);
	}

	if (state.pending.length >= reportCount) {
		report(state.pending);
		state.pending = [];
	}

	function report(tracks) {
		parentPort.postMessage({
			type: 'progress',
			tracks: tracks.filter(t => !t.existing),
			processed: state.processed,
			total: state.total,
		});
	}
	

}

function idle() {
	parentPort.postMessage('IDLE')
}

function checkComplete() {
	if (
		!state.processing &&
		state.queue.length === 0 &&
		state.scanning === 0
	) {

		reportProgress();

		parentPort.postMessage({
			type: 'done',
			total: state.total,
			processed: state.processed,
			imported: state.imported,
			skipped: state.skipped,
			errors: state.errors
		});

		idle();
	}
}
