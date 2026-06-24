// src/main/scanner.js
import { parentPort, workerData } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import * as mm from 'music-metadata';

import { getMetaFromFilename3 } from '../utils/track';
import { generateThumb } from '../utils/thumb';

const { folderPaths, resolver } = workerData;

const isMedia = (name) => /\.(mp3|flac|ogg|m4a|mp4|mkv|webm)$/i.test(name);
const isVideo = (name) => /\.(mp4|mkv|webm)$/i.test(name);
const isImage = (name) => /\.(jpg|jpeg|png)$/i.test(name);

async function scan() {
	for (const rootPath of folderPaths) {
		await walk(rootPath);
	}

	parentPort.postMessage({ type: 'DONE' });
};

async function walk(dir) {
	
	const files = fs.readdirSync(dir, { withFileTypes: true });

	const audioInFolder = [];
	const imagesInFolder = [];
	
	for (const file of files) {
		const fullPath = path.join(dir, file.name);

		if (file.isDirectory()) {
			await walk(fullPath);
		} else if (isMedia(file.name)) {
			audioInFolder.push(fullPath);
		}
		else if (isImage(file.name)) {
			imagesInFolder.push(fullPath);
		}
	}

	if (audioInFolder.length > 0) {
		await processFolder(audioInFolder, imagesInFolder);
	}

}

async function processFolder(paths, images) {
	const tracks = [];
	let consistentAlbum = null;
	let allHaveMeta = true;
	let albumGenre = null;
	let albumYear = null;

	for (const filePath of paths) {

		// console.log('Parsing meta:', filePath);

		try {
			const metadata = await mm.parseFile(filePath);

			// Pick the first genre found to represent the album
			if (!albumGenre && metadata.common.genre?.length > 0) {
				albumGenre = metadata.common.genre[0]; 
			}

			if (!albumYear && metadata.common.year) {
				albumYear = metadata.common.year;
			} else if (!albumYear && metadata.common.date) {
				// Fallback for 'date' strings (e.g., "2008-10-21")
				const match = metadata.common.date.match(/\d{4}/);
				if (match) albumYear = parseInt(match[0]);
			}

			const album = metadata.common.album;

			if (!album) allHaveMeta = false;
			else if (!consistentAlbum) consistentAlbum = album;
			else if (consistentAlbum !== album) allHaveMeta = false;

			const { name, ext } = path.parse(filePath);
			const type = isVideo(ext) ? 'video' : 'audio'; 
			const meta = type == 'video' 
				? getMetaFromFilename3(name, false) 
				: { title: name };

			const track = {
				path: filePath,
				title: metadata.common.title || meta.title,
				artist: metadata.common.artist || meta.artist || 'Unknown Artist',
				album: album || 'Unknown Album',
				duration: Math.round(metadata.format.duration || 0),
				type
			};

			if (type === 'video') 
				track.thumb_path = await generateThumb(filePath, resolver.thumb);

			tracks.push(track);
		} catch (e) {
			console.error('Failed to parse file meta:', e);
			allHaveMeta = false;
		}
	}

	const createAlbum = allHaveMeta && consistentAlbum;

	// Determine Album Art: Largest image in folder
	let cover = null;
	if (images.length > 0) {
		cover = images.map(img => ({ path: img, size: fs.statSync(img).size }))
					  .sort((a, b) => b.size - a.size)[0].path;
	}
	else if (createAlbum) {
		// todo: fetch from online sources like MusicBrainz or TheAudioDB as a fallback
	}

	parentPort.postMessage({
		type: 'FOLDER_READY',
		data: {
			createAlbum,
			name: consistentAlbum,
			artist: tracks[0]?.artist,
			genre: albumGenre || 'Unknown',
			year: albumYear,
			cover,
			tracks
		}
	});
}

scan();
