import { parentPort, workerData } from 'node:worker_threads'
import fs from 'node:fs/promises'
import { join, parse } from 'node:path'

import * as mm from 'music-metadata';
import ytdl from "ytdl-core";

import { generateThumb } from '../utils/thumb';
import { getMetaFromFilename3 } from '../utils/track';


import '../../common/string';

process.env.YTDL_NO_UPDATE = '1';

// --- CONFIG ---
const CONCURRENCY = 2

// --- STATE ---
let queue = []
let files = []
let dirs = new Map

let scanning = false
let processing = false
let cancelled = false

const isMedia = (name) => /\.(mp3|flac|ogg|m4a|mp4|mkv|webm)$/i.test(name);
const isVideo = (name) => /\.(mp4|mkv|webm)$/i.test(name);
const isImage = (name) => /\.(jpg|jpeg|png)$/i.test(name);

const hasMeta = (name) => /\.(mp3|flac|ogg|mp4|wav|aiff)$/i.test(name);


const { userDirs } = workerData;


// --- MESSAGE HANDLER ---
parentPort.on('message', async (msg) => {
	if (msg.type === 'add') {
		queue.push(msg.path)
		run()
	}

	if (msg.type === 'cancel') {
		cancelled = true
	}
})

// --- MAIN ORCHESTRATOR ---
async function run() {
	if (scanning || processing) return

	cancelled = false
	files = []

	scanning = true

	parentPort.postMessage({ type: 'scan-start' })

	while (queue.length > 0) {

		const path = queue.shift()
		const stat = await fs.stat(path)

		if (stat.isDirectory())
			await scan(path)
		else
			files.push({ path })
	}

	scanning = false

	parentPort.postMessage({
		type: 'scan-complete',
		total: files.length
	})

	if (cancelled) {
		parentPort.postMessage({ type: 'cancelled' })
		return idle()
	}

	await processFilesParallel()

	if (cancelled) {
		parentPort.postMessage({ type: 'cancelled' })
	} else {
		parentPort.postMessage({ type: 'done' })
	}

	idle()
}

// --- SCAN PHASE ---
async function scan(dir) {
	if (cancelled) return
	if (dirs.has(dir)) return

	let entries
	let d = { start: files.length, images: [] }
	let folders = []

	try {
		entries = await fs.readdir(dir, { withFileTypes: true })
	} catch (err) {
		parentPort.postMessage({ type: 'error', error: err.message })
		return
	}

	for (const entry of entries) {
		if (cancelled) return

		const path = join(dir, entry.name)

		if (entry.isDirectory()) {
			folders.push(path)
		} else if (isMedia(entry.name)) {
			files.push({ path, parent: d })
		}
		else if (isImage(entry.name)) {
			d.images.push(path)
		}
	}

	d.end = files.length

	if (d.end - d.start > 0) {

		if (d.images.length > 0) {

			const images = []
			for (const i of d.images) {

				const stat = await fs.stat(i)

				images.push({ path: i, size: stat.size })

			}

			const path = images.sort((a, b) => b.size - a.size)[0].path
			const { ext } = parse(path);

			const dest = join(userDirs.thumbs, `${path.hashHex()}${ext}`)

			await fs.cp(path, dest)

			d.cover = dest

			delete d.images
		}

		dirs.set(dir, d)
	}

	for (const d of folders)
		await scan(d)
}

// --- PROCESS PHASE (PARALLEL) ---
async function processFilesParallel() {
	processing = true

	let index = 0
	const total = files.length

	async function workerLoop() {
		while (true) {
			if (cancelled) return

			const i = index++
			if (i >= total) return

			const file = files[i]

			try {
				await processFile(file)
			} catch (err) {
				parentPort.postMessage({
					type: 'error',
					error: err.message,
					file
				})
			}

			parentPort.postMessage({
				type: 'progress',
				file,
				processed: i + 1,
				total,
				progress: Math.round(((i + 1) / total) * 100)
			})
		}
	}

	// await Promise.all(
	// 	Array(CONCURRENCY).fill(0).map(workerLoop)
	// )
	await workerLoop();

	processing = false
}

// --- FILE PROCESSING (YOUR LOGIC HERE) ---
async function processFile(file) {
	
	const { path } = file;
	const { name, ext } = parse(path);

	file.title = name;
	file.type = isVideo(ext) ? 'video' : 'audio';
	file.filename = name;
	// file.path = resolver.normalize(path);

	if (hasMeta(path)) {
		await parseMeta(file, path);
	}

	if (file.type == 'video') {
		const m = name.match(/\[([a-zA-Z0-9_-]{11})\]$/) // youtube id
		if (m) {
			const id = m[1];

			try {
				await getYoutubeInfo(file, id);
			}
			catch (e) {
				console.error('Failed to fetch youtube info:', e);

				parseMetaFromTitle(file);
			}
		}
		else {
			parseMetaFromTitle(file);
		}

		if (!file.thumb_path) {
			const thumbName = name.hashHex();

			file.thumb_path = await generateThumb(path, userDirs.thumbs, thumbName);
		}
	}

	async function parseMeta(file, path) {

		if (!path)
			path = file.path;

		const parent = file.parent;
		if (parent) {
			file.cover_path = parent.cover;

			delete file.parent;
		}

		try {
			const metadata = await mm.parseFile(path);
			const { common, format } = metadata;


			if (common.genre?.length > 0)
				file.genre = common.genre[0];

			if (common.year)
				file.year = common.year;
			else if (common.date) {
				// Fallback for 'date' strings (e.g., "2008-10-21")
				const match = common.date.match(/\d{4}/);
				if (match) 
					file.year = parseInt(match[0]);
			}

			if (common.artist)
				file.artist = normalize(common.artist)

			if (common.album) {
				file.album = normalize(common.album)

				if (file.artist) {
					file.track_no = common.track?.no || 0
					file.albumId = `${file.artist} - ${file.album}`.hashCode()
				}
			}

			if (common.title)
				file.title = normalize(common.title)

			file.duration = Math.ceil(format?.duration || 0)

			// const picture = common.picture?.find(p =>
			// 	p.type === 'Cover (front)'
			// 	) || common.picture?.[0];

			if (common.picture && Array.isArray(common.picture)) {

				console.debug('Picture buffer found:', file.path);

				for (const picture of common.picture) {

					if (!validateCover(picture.data))
						continue;

					const ext = picture.format === 'image/png' ? 'png' : 'jpg';
					const path = join(userDirs.thumbs, `${file.filename.hashHex()}.${ext}`);

					await fs.writeFile(path, picture.data);

					file.thumb_path = path;

				}

				// const base64 = picture.data.toString('base64');
				// const src = `data:${picture.format};base64,${base64}`;
			}

			// access raw ID3 frames
			const id3 = metadata.native['ID3v2.3'] || metadata.native['ID3v2.4']

			// find your custom tag
			if (id3) {

				const tag = id3.find(t => t.id === 'TXXX:tag')
				
				file.tag = tag?.value
			}

			// console.debug('Meta:', common, format, id3);
			// console.debug('TRACK:', file);

		}
		catch (e) {
			console.error('Failed to parse file meta:', e);
		}

		function validateCover(buffer) {
			if (!buffer || buffer.length < 1024) return false;

			if (buffer.length > 10 * 1024 * 1024) return false;

			const type = getImageType(buffer);
			if (!type) return false;

			return true;
		}

		function getImageType(buffer) {
			if (!buffer || buffer.length < 4) return null;

			// JPEG
			if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'image/jpeg';

			// PNG
			if (
				buffer[0] === 0x89 &&
				buffer[1] === 0x50 &&
				buffer[2] === 0x4E &&
				buffer[3] === 0x47
			) return 'image/png';

			return null;
		}
	}

	function parseMetaFromTitle(file) {
		const { title, artist } = getMetaFromFilename3(file.title);

		file.title = title;
		file.artist = artist;
	}

	async function getYoutubeInfo(file, id) {

		// const url = `https://www.youtube.com/watch?v=${id}`;

		// const info = await ytdl.getInfo(url);
		const info = await ytdl.getBasicInfo(id,
			{
				requestOptions: {
					headers: {
						'user-agent': 'Mozilla/5.0',
					},
				},
			}
		);

		const details = info.videoDetails;

		file.title = details.title;
		file.artist = details.author.name;

		let thumb;

		for (thumb of details.thumbnails.reverse()) {
			if (thumb.width < 400)
				break;
		}

		if (thumb) {

			const path = join(userDirs.thumbs, `${id}.jpg`);
			const exists = await fileExists(path);

			if (!exists)
				await downloadImage(thumb.url, path);

			file.thumb_path = path;

		}
	}

	async function downloadImage(url, path) {


		const res = await fetch(url);

		if (!res.ok) {
			throw new Error(`Failed to fetch image: ${res.status}`);
		}

		const buffer = await res.arrayBuffer();

		await fs.writeFile(path, Buffer.from(buffer));

	}
}

// --- IDLE STATE ---
function idle() {
	parentPort.postMessage({ type: 'idle' })
}

async function fileExists(path) {
	try {
		await fs.access(path);

		return true;
		
	} catch {
		
	}

	return false;
}

function normalize(str) {
	return str.trim().replace(/  +/g, ' ');
}