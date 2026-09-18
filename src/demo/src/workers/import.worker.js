import createMetadataModule from '@wasm/metadata.js';
import metadataWasmUrl from '@wasm/metadata.wasm?url';

import '@common/object';

import db from '../db';

const SUPPORTED_EXTENSIONS = new Set([
	'mp3',
	'flac',
	'ogg',
	'm4a',
	'mp4',
	'mkv',
	'webm'
]);

const TIME_REF = 1788041694516;

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

	directories: new Map(),
	albums: new Map(),
	thumbs: new Set()
};

let wasm;

self.onmessage = async (event) => {

	if (typeof event.data == 'string') {

		switch (event.data) {

			case 'SHUTDOWN':
			db.close();
			self.close();
			break;

			case 'CANCEL':
			state.canceled = true
			break;

		}

		return;
	}

	const { type } = event.data;

	try {
		switch (type) {

			case 'add':
			await addHandles(event.data.handles);
			break;

			case 'cancel':
			cancelImport();
			break;

		}
	} catch (error) {
		self.postMessage({
			type: 'error',
			error: error.message
		});
	}
};

async function addHandles(handles) {
	state.scanning++;

	console.debug('[IMPORTER] add files:', handles.length);

	// postProgress();


	const directory = createDirectoryState();

	try {
		for (const handle of handles) {
			for await (const item of walkHandle(handle, directory)) {
				// if (!isSupportedHandle(item.fileHandle)) {
				// 	continue;
				// }

				state.queue.push(item);
				state.total++;

				// postProgress();
			}
		}
	} finally {
		state.scanning--;
		// postProgress();

		processQueue();
	}
}

async function* walkHandle(handle, parent) {

	if (handle.kind === 'file') {
		if (!isSupportedHandle(handle))
			return;

		parent.totalFiles++;
		
		yield {
			fileHandle: handle,
			parent,
		};

		return;
	}

	if (handle.kind !== 'directory') {
		return;
	}

	const directory = createDirectoryState(handle, parent);

	for await (const entry of handle.values()) {
		yield* walkHandle(entry, directory);
	}
}

function createDirectoryState(handle, parentId = null) {
	const id = crypto.randomUUID();

	const directory = {
		id,
		handle,
		name: handle?.name || 'root',
		parentId,

		totalFiles: 0,
		parsedFiles: 0,
		failedFiles: 0,

		scanComplete: false,
		albumChecked: false,

		tracks: []
	};

	console.debug('Directory:', directory);

	return directory;
}

function postProgress(track, isNew) {
	self.postMessage({
		type: 'progress',

		total: state.total,
		processed: state.processed,
		imported: state.imported,
		skipped: state.skipped,
		errors: state.errors,

		queued: state.queue.length,
		scanning: state.scanning,
		processing: state.processing,

		tracks: isNew ? [track] : []
	});
}

async function processQueue() {
	if (state.processing) {
		return;
	}

	state.processing = true;

	self.postMessage({ type: 'scan-start' });

	try {

		await db.open();
		await loadWasm();

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

	try {
		const file = await item.fileHandle.getFile();
		const { format, metadata, cover } = await parseMetadata(file);

		const title = metadata.title;
		const album = metadata.album || metadata.album_artist;
		const artist = metadata.artist || metadata.album_artist;
		const genre = metadata.genre;
		const now = Date.now();

		const track = {
			path: item.fileHandle,

			type: file.type.startsWith('video') ? 'video' : 'audio',
			id: format.hash,
			duration: format.duration,
			title: title || file.name.substr(0, file.name.lastIndexOf('.')),
			album,
			artist,
			genre,
			rating: -now,
			created_at: now,
			played_at: 2*TIME_REF - now,
			fts: createFTSIndex({ title, album, artist, genre })
		};

		if (cover) {

			const id = cover.hash;

			if (!state.thumbs.has(id)) {
				const blob = new Blob([cover.buffer], { type: cover.mime });

				await db.put('thumb', { id, blob });

				state.thumbs.add(id);
			}

			track.cover = id;
		}

		// console.debug('Parsed meta:', format, metadata);

		let isNew = true;

		try {
			await db.add('track', track);
		}
		catch (error) {
			if (error.name === 'ConstraintError') {
				console.debug('Track already exists:', file.title);

				isNew = false;
			} else {
				throw error;
			}
		}

		//await db.put('track', track);

		track.track_no = metadata.track ? parseTrackNumber(metadata.track) : 0;

		directory.tracks.push(track);

		state.imported++;

		postProgress(track, isNew);
	}
	catch (error) {
		console.error(`Failed to parse ${item.fileHandle.name}`, error);

		directory.failedFiles++;
		state.errors++;
	}
	finally {
		directory.parsedFiles++;
		state.processed++;

		maybeCheckAlbum(directory);
		// postProgress();
	}

	function parseTrackNumber(value) {
		if (!value) return null;

		const match = String(value).match(/^(\d+)/);
		return match ? parseInt(match[1], 10) : null;
	}

	function createFTSIndex(track) {
    
		// Combine all searchable fields
		const searchText = [
			track.title,
			track.album,
			track.artist,
			track.genre
		].join(' ').trim();
		
		// Generate tokens
		const tokens = db.tokenize(searchText);
		
		// Store tokens as a separate property
		return tokens;
    }
}


async function parseMetadata(file) {
	 
	const buffer = await file.arrayBuffer();

	// Allocate memory and copy input
	const ptr = wasm._malloc(buffer.byteLength);

	wasm.HEAPU8.set(
		new Uint8Array(buffer),
		ptr
	);

	const resultPtr = wasm._parse_audio_metadata(ptr, buffer.byteLength);
	const res = JSON.parse(wasm.UTF8ToString(resultPtr));

	const coverSize = wasm._get_cover_size();

	let coverBuffer = null;
	let coverMime = null;
	let coverHash = null;

	if (coverSize > 0) {
		const coverPtr = wasm._get_cover_data();

		// Make a COPY out of WASM memory.
		const data = new Uint8Array(
			wasm.HEAPU8.buffer,
			coverPtr,
			coverSize
		);

		res.cover = {
			buffer: new Uint8Array(data).buffer,
			mime: wasm.UTF8ToString(wasm._get_cover_mime()),
			hash: wasm._get_cover_hash()
		};

		wasm._free_cover();
	}

	// console.log("### JSON res:", json);

	wasm._free_metadata(resultPtr);
	wasm._free(ptr);

	return res;
}

function checkComplete() {
	if (
		!state.processing &&
		state.queue.length === 0 &&
		state.scanning === 0
	) {
		self.postMessage({
			type: 'complete',
			total: state.total,
			processed: state.processed,
			imported: state.imported,
			skipped: state.skipped,
			errors: state.errors
		});
	}
}

function maybeCheckAlbum(directory) {
	if (directory.parsedFiles == directory.totalFiles)
		checkDirectoryAlbum(directory.tracks);
}

function checkDirectoryAlbum(tracks) {

	if (tracks.length === 0) 
		return;

	const first = tracks[0];

	const album = normalize(first.album);
	const artist = normalize(first.artist);

	if (!album || !artist) {
		return;
	}

	const isAlbum = tracks.every((track) => {
		const trackAlbum = normalize(track.album);
		const trackArtist = normalize(track.artist);

		return (
			trackAlbum === album &&
			trackArtist === artist
		);
	});

	if (!isAlbum) {
		return;
	}

	createAlbum({
		name: first.album,
		artist: first.artist,
		genre: first.genre,
		tracks
	});

	function normalize(value) {
		return (value ?? '')
			.trim()
			.replace(/\s+/g, ' ')
			.toLocaleLowerCase();
	}
}

async function createAlbum({ name, artist, genre, tracks }) {

	let cover;

	for (const t of tracks) {
		if (t.cover) {
			cover = t.cover;
			break;
		}
	}

	const now = Date.now();

	const a = {
		type: 'album',
		name,
		artist,
		genre,
		cover,
		track_count: tracks.length,
		total_rating: 0,
		total_duration: tracks.map(i => i.duration).sum(),
		created_at: now,
		played_at: 2*TIME_REF - now
	};


	console.debug('Creating album:', a);

	const existing = await db.find('collection', 'type_name_artist', ['album', name, artist]);
	if (existing) {

		db.update('collection', existing.id, {
			name: name || existing.name,
			artist: artist || existing.artist,
			genre: genre || existing.genre
		});

		a.id = existing.id;
	}
	else {
		const [id] = await db.add('collection', a);

		a.id = id;
	}

	tracks.sort((a, b) => a.track_no - b.track_no);

	// await db.put('collection_tracks', { 
	// 	id: a.id, 
	// 	tracks: tracks.map(i => i.id) 
	// });

	const order = tracks.map((track, position) => ({ 
		collection_id: a.id, 
		track_id: track.id, 
		position 
	}));

	await db.add('collection_tracks', order);

	if (!existing)
		self.postMessage(a);
}

function isSupportedHandle(handle) {
	if (handle.kind !== 'file') {
		return false;
	}

	const extension = handle.name
		.split('.')
		.pop()
		?.toLowerCase();

	return SUPPORTED_EXTENSIONS.has(extension);
}


function cancelImport() {
	
}

let wasmPromise = null;

function getWasm() {
	if (!wasmPromise) {
		wasmPromise = createMetadataModule({
			locateFile(path) {
				if (path.endsWith('.wasm')) {
					return metadataWasmUrl;
				}

				return path;
			}
		});
	}

	return wasmPromise;
}

async function loadWasm() {
	if (wasm) return wasm;

	wasm = await createMetadataModule({
		locateFile(path) {
			if (path.endsWith('.wasm')) {
				return metadataWasmUrl;
			}

			return path;
		}
	});
}