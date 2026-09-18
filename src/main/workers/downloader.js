const { parentPort, workerData } = require('node:worker_threads');

const fs = require('node:fs');
const path = require('node:path');

import '../../common/string';
import '../../common/object';

import { LibraryDatabase } from '../db/library';
import { Image } from '../utils/image';

const { userDirs } = workerData;

const THUMBS_DIR = userDirs.thumbs;
const DATABASE_DIR = userDirs.database;
const DOWNLOAD_DIR = userDirs.downloads;

const db = LibraryDatabase.create(DATABASE_DIR);

// Prepare statements for optimization
const checkHashStmt = db.prepare('SELECT id, path FROM track WHERE hash = ?');
// const insertTrackStmt = db.prepare(`
// 	INSERT INTO track (hash, title, artist, album, album_id, genre, path, duration, type, thumb_path, tag)
// 	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// `);

const MAX_CONCURRENT_TASKS = 4;

const queue = [];

let activeWorkers = 0;
let running = false;
let canceled = false;


parentPort.on('message', (task) => {

	if (typeof task == 'string') {

		switch (task) {

			case 'SHUTDOWN':
			db.close();
			process.exit(0);
			break;

			case 'CANCEL':
			canceled = true;
			queue.length = 0; 
			break;

		}

		return;
	}

	queue.push(task);

	//run();
	processQueue();
});

async function processQueue() {
	// If we hit our parallel limit or there's nothing to process, halt
	if (activeWorkers >= MAX_CONCURRENT_TASKS || queue.length === 0) {
		// Send IDLE status only if absolutely no workers are running and queue is dry
		if (activeWorkers === 0 && queue.length === 0) {
			parentPort.postMessage('IDLE');
		}
		return;
	}

	// Claim a parallel slot
	activeWorkers++;
	
	const task = queue.shift();

	// Immediately try to fill the next slot if available, before running this long task
	processQueue();

	try {
		// Reset cancel flag at the start of a fresh task run if desired
		if (canceled) canceled = false; 

		switch (task.type) {
			case 'DOWNLOAD_ALBUM':
			await downloadAlbum(task.item, task.player, task.opt);
			break;

			case 'DOWNLOAD_PLAYLIST':
			await downloadPlaylist(task.item, task.player, task.opt);
			break;

			case 'DOWNLOAD_TRACK':
			await downloadTrack(task.item, task.player, task.opt);
			break;
		}
	} catch (err) {
		console.error('Download error:', err);
		reportError(err.message, task.type, task.item);
	} finally {
		// Task is finished, free the concurrency slot
		activeWorkers--;
		
		// Trigger the next check to see if a queued item was waiting
		processQueue();
	}

	function reportError(message, type, item) {
		console.error('[DOWNLOADER] error:', type, message);

		parentPort.postMessage({ 
			type: 'ERROR',
			itemType: type,
			itemId: item.id, 
			message 
		});
	}
}


async function run() {

	if (running) return;

	running = true;

	while (queue.length > 0) {
		const task = queue.shift();

		switch (task.type) {

			case 'DOWNLOAD_ALBUM':
			await downloadAlbum(task.item, task.remoteUrl, task.opt);
			break;

		}
	}

	running = false;

	parentPort.postMessage('IDLE');
}

async function downloadAlbum(album, player, opt) {

	const remoteId = player.id;
	const remoteUrl = player.url;

	let progress = 0;

	// 1. Fetch tracks belonging to this album from the remote instance's metadata endpoint
	// (Assuming your transport layer exposes an API endpoint to view track components of an album)
	const res = await fetch(`${remoteUrl}/api/album/${album.id}/tracks`);
	const tracks = await res.json();

	console.debug('[DOWNLOADER]: album tracks:', tracks.length);
	
	let totalAlbumBytes = 0;
	let downloadedAlbumBytes = 0;

	const trackDownloadQueue = [];

	if (album.cover_path)
		album.cover_path = await Image.downloadThumbFile(album.cover_path, THUMBS_DIR);

	// 2. Pre-flight head check to deduce size and isolate missing files
	for (const track of tracks) {

		if (track.thumb_path)
			track.thumb_path = await Image.downloadThumbFile(`${remoteUrl}/${track.thumb_path}`, THUMBS_DIR);

		// const local = checkHashStmt.get(track.hash);
		// if (local) {
		// 	track.path = local.path;
		// 	continue; // Skip downloading if hash already exists locally
		// }

		// Request headers to fetch the full stream size
		const url = `${remoteUrl}/media/${track.id}`;

		track.url = url;

		if (!track.size) {
			const headRes = await fetch(url, { method: 'HEAD' });

			track.size = parseInt(headRes.headers.get('content-length') || '0', 10);
		}
		
		totalAlbumBytes += track.size;

		trackDownloadQueue.push(track);
	}

	// If all tracks exist locally, complete instantly
	if (trackDownloadQueue.length === 0 || totalAlbumBytes === 0) {
		reportProgress('completed', 100, album);
		return;
	}

	fs.mkdirSync(opt.dir, { recursive: true });

	// 3. Download the remaining queue sequentially
	for (const track of trackDownloadQueue) {
		const response = await fetch(track.url);
		if (!response.ok) 
			throw new Error(`HTTP error! status: ${response.status}`);

		const filename = opt.filename
			.replace('[ARTIST]', album.artist)
			.replace('[ALBUM]', album.name)
			.replace('[ALBUM_YEAR]', album.year ? `${album.name} (${album.year})` : album.name)
			.replace('[GENRE]', album.genre)
			.replace('[INDEX]', track.position > 9 ? `${track.position}` : `0${track.position}` )
			.replace('[TITLE]', track.title) + `.${track.mime}`;

		const targetPath = path.join(opt.dir, filename);
		const fileStream = fs.createWriteStream(targetPath);
		const reader = response.body.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			fileStream.write(Buffer.from(value));
			downloadedAlbumBytes += value.length;

			// Send the proportional unified progress update back to the Svelte layer
			const overallPercent = Math.floor((downloadedAlbumBytes / totalAlbumBytes) * 100);
			const prog = Math.min(overallPercent, 99);

			if (prog - progress >= 1) {
				progress = prog;

				reportProgress('downloading', prog, remoteId);
			}
			
		}

		fileStream.end();

		track.path = targetPath;

		// // 4. Safely insert track transaction details into local SQLite index
		// insertTrackStmt.run(
		// 	track.hash, track.title, track.artist, track.album, album.id,
		// 	track.genre, targetPath, track.duration, track.type || 'audio', 
		// 	track.thumb_path, track.tag
		// );
	}


	// console.debug('[DOWNLOADER] Creating album:', album, tracks);

	// All tracks written successfully
	reportProgress('completed', 100, album, remoteId);

	db.addAlbum({ ...album }, tracks, true);

	album.tracks = tracks.filter(i => !i.existing);
	reportCompleted(localAlbum);
	
	function reportProgress(status, progress, remoteId) {
		parentPort.postMessage({ 
			type: 'PROGRESS', 
			status,
			progress,
			itemType: 'album',
			itemId: album.id, 
			remoteId
		});
	}

	function reportCompleted() {
		parentPort.postMessage({ 
			type: 'COMPLETED', 
			itemType: 'album',
			item: album
		});
	}
}

async function downloadPlaylist(playlist, player, opt) {

	const remoteId = player.id;
	const remoteUrl = player.url;

	let progress = 0;
	let totalplaylistBytes = 0;
	let downloadedplaylistBytes = 0;

	const res = await fetch(`${remoteUrl}/api/playlist/${playlist.id}/tracks`);
	const tracks = await res.json();

	console.debug('[DOWNLOADER]: playlist tracks:', tracks.length);

	const trackDownloadQueue = [];

	// 2. Pre-flight head check to deduce size and isolate missing files
	for (const track of tracks) {

		if (opt.overwrite == 'skip') {
			const existing = db.findTrack('hash', track.hash);
			if (existing) {
				continue;
			}
		}

		if (track.thumb_path)
			track.thumb_path = await Image.downloadThumbFile(`${remoteUrl}/${track.thumb_path}`, THUMBS_DIR);

		// const local = checkHashStmt.get(track.hash);
		// if (local) {
		// 	track.path = local.path;
		// 	continue; // Skip downloading if hash already exists locally
		// }

		// Request headers to fetch the full stream size
		const url = `${remoteUrl}/media/${track.id}`;

		track.url = url;

		if (!track.size) {
			const headRes = await fetch(url, { method: 'HEAD' });

			track.size = parseInt(headRes.headers.get('content-length') || '0', 10);
		}
		
		totalplaylistBytes += track.size;

		trackDownloadQueue.push(track);
	}

	// If all tracks exist locally, complete instantly
	if (trackDownloadQueue.length === 0 || totalplaylistBytes === 0) {
		reportProgress('completed', 100, playlist);
		return;
	}

	fs.mkdirSync(opt.dir, { recursive: true });

	// 3. Download the remaining queue sequentially
	for (const track of trackDownloadQueue) {
		const response = await fetch(track.url);
		if (!response.ok) 
			throw new Error(`HTTP error! status: ${response.status}`);

		const filename = opt.filename
			.replace('[ARTIST]', track.artist || '')
			.replace('[GENRE]', playlist.genre || track.genre || '')
			.replace('[TITLE]', track.title) + 
			`.${track.mime}`;

		const targetPath = path.join(opt.dir, filename);
		const fileStream = fs.createWriteStream(targetPath);
		const reader = response.body.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			fileStream.write(Buffer.from(value));
			downloadedplaylistBytes += value.length;

			// Send the proportional unified progress update back to the Svelte layer
			const overallPercent = Math.floor((downloadedplaylistBytes / totalplaylistBytes) * 100);
			const prog = Math.min(overallPercent, 99);

			if (prog - progress >= 1) {
				progress = prog;

				reportProgress('downloading', prog, remoteId);
			}
			
		}

		fileStream.end();

		track.path = targetPath;

		// // 4. Safely insert track transaction details into local SQLite index
		// insertTrackStmt.run(
		// 	track.hash, track.title, track.artist, track.playlist, playlist.id,
		// 	track.genre, targetPath, track.duration, track.type || 'audio', 
		// 	track.thumb_path, track.tag
		// );
	}


	// console.debug('[DOWNLOADER] Creating playlist:', playlist, tracks);

	// All tracks written successfully
	reportProgress('completed', 100, remoteId);

	db.addPlaylist(playlist, trackDownloadQueue, opt.overwrite);

	playlist.tracks = tracks;
	reportCompleted();
	
	function reportProgress(status, progress, remoteId) {
		parentPort.postMessage({ 
			type: 'PROGRESS', 
			status,
			progress,
			itemType: 'playlist',
			itemId: playlist.id, 
			remoteId
		});
	}

	function reportCompleted() {
		parentPort.postMessage({ 
			type: 'COMPLETED', 
			itemType: 'playlist',
			item: playlist
		});
	}
}

async function downloadTrack(track, player, opt) {
	const remoteId = player.id;
	const remoteUrl = player.url;

	if (opt.overwrite == 'skip') {
		const existing = db.findTrack('hash', track.hash);
		if (existing) {
			console.debug('[DOWNLOADER] track skipped:', track.hash);
			reportProgress('completed', 100, remoteId);
			return;
		}
	}

	if (track.thumb_path)
		track.thumb_path = await Image.downloadThumbFile(`${remoteUrl}/${track.thumb_path}`, THUMBS_DIR);

	const url = `${remoteUrl}/media/${track.id}`;

	track.url = url;

	if (!track.size) {
		const headRes = await fetch(url, { method: 'HEAD' });

		track.size = parseInt(headRes.headers.get('content-length') || '0', 10);
	}
	
	const response = await fetch(track.url);
		if (!response.ok) 
			throw new Error(`HTTP error! status: ${response.status}`);

	const filename = opt.filename
		.replace('[ARTIST]', track.artist)
		.replace('[GENRE]', track.genre)
		.replace('[TITLE]', track.title) 
		+ `.${track.mime}`;

	const targetPath = path.join(opt.dir, filename);
	const fileStream = fs.createWriteStream(targetPath);
	const reader = response.body.getReader();

	let downloadedAlbumBytes = 0;
	let progress = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		fileStream.write(Buffer.from(value));
		downloadedAlbumBytes += value.length;

		// Send the proportional unified progress update back to the Svelte layer
		const overallPercent = Math.floor((downloadedAlbumBytes / track.size) * 100);
		const prog = Math.min(overallPercent, 99);

		if (prog - progress >= 1) {
			progress = prog;

			reportProgress('downloading', prog, track, remoteId);
		}
	}

	fileStream.end();

	track.path = targetPath;

	reportProgress('completed', 100, remoteId);

	db.addTrack(track, opt.overwrite == 'move');

	reportCompleted();

	function reportProgress(status, progress, remoteId) {
		parentPort.postMessage({ 
			type: 'PROGRESS', 
			status,
			progress,
			itemType: 'track',
			itemId: track.id, 
			remoteId
		});
	}

	function reportCompleted() {
		parentPort.postMessage({ 
			type: 'COMPLETED', 
			itemType: 'track',
			item: track 
		});
	}
}

async function getTrackBinaryStream(track, remoteUrl) {
	// CURRENT CURRENT HTTP IMPLEMENTATION
	const url = `${remoteUrl}/media/${track.id}`;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
	
	return {
		size: parseInt(response.headers.get('content-length') || '0', 10),
		reader: response.body.getReader()
	};

	/* 
	// FUTURE LIBP2P IMPLEMENTATION:
	// You will open a stream using a specific protocol handler, e.g., '/p2p/media/1.0.0'
	const stream = await libp2pNode.dialProtocol(peerId, '/p2p/media/1.0.0');
	
	// Send a lightweight control message indicating the desired track ID
	await stream.sink([Buffer.from(JSON.stringify({ trackId: track.id }))]);
	
	// Read total track meta size from the first frame, then return the standard async reader
	return {
		size: track.expectedSize, 
		reader: stream.source.getReader()
	};
	*/
}

