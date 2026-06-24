// import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";
//import NodeID3 from "node-id3";

export async function getAlbumCover(artist, album) {

	const queryUrl = `https://musicbrainz.org/ws/2/release/?query=artist:${encodeURIComponent(artist)} AND release:${encodeURIComponent(album)}&fmt=json`;

	// 1. Search MusicBrainz
	const mbRes = await fetch(
		queryUrl,
		{
			headers: {
				"User-Agent": "PulsePlayer"
			}
		}
	);

	const mbData = await mbRes.json();
	if (!mbData.releases || mbData.releases.length === 0) return null;

	const releaseId = mbData.releases[0].id;

	// 2. Fetch cover art
	const coverUrl = `https://coverartarchive.org/release/${releaseId}/front`;

	// Check if image exists
	const coverRes = await fetch(coverUrl);
	if (!coverRes.ok) return null;

	return coverUrl; // You can download and cache it
}

async function getAlbumCoverTheAudioDB(artist, album) {
	const apiKey = "YOUR_API_KEY"; // free
	const url = `https://theaudiodb.com/api/v1/json/${apiKey}/searchalbum.php?s=${encodeURIComponent(artist)}&a=${encodeURIComponent(album)}`;

	const res = await fetch(url);
	const data = await res.json();

	return data.album?.[0]?.strAlbumThumb || null;
}

export async function downloadCoverImage(url, fileName) {
	const res = await fetch(url);

	if (!res.ok) {
		throw new Error(`Failed to fetch image: ${res.status}`);
	}

	const buffer = await res.arrayBuffer();
	const filePath = path.join(COVER_DIR, fileName);

	await fs.promises.writeFile(filePath, Buffer.from(buffer));
	return filePath;
}

async function downloadImage(url, path, fileName) {


	const res = await fetch(url);

	if (!res.ok) {
		throw new Error(`Failed to fetch image: ${res.status}`);
	}

	const buffer = await res.arrayBuffer();
	const filePath = path.join(path, fileName);

	await fs.promises.writeFile(filePath, Buffer.from(buffer));
	return filePath;
}


function coverFileName(artist, album) {
	const hash = crypto
		.createHash("sha1")
		.update(`${artist}-${album}`)
		.digest("hex");

	return `${hash}.jpg`;
}

async function normalizeCover(filePath) {
	await sharp(filePath)
		.resize(512, 512, { fit: "cover" })
		.jpeg({ quality: 90 })
		.toFile(filePath + ".tmp");

	await fs.promises.rename(filePath + ".tmp", filePath);
}

// artwork inside the file
// NodeID3.update(
//   {
//     image: filePath
//   },
//   mp3FilePath
// );