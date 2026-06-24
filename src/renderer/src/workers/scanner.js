import * as mm from 'music-metadata-browser';

self.onmessage = async (e) => {
	const { files } = e.data;
	const totalFiles = files.length;
	let processed = 0;

	// Group files by their parent directory
	const directoryMap = {};

	for (const file of files) {
		const dir = file.path.substring(0, file.path.lastIndexOf('/'));
		if (!directoryMap[dir]) directoryMap[dir] = { audio: [], images: [] };
		
		if (file.type.startsWith('audio/')) directoryMap[dir].audio.push(file);
		else if (file.type.startsWith('image/')) directoryMap[dir].images.push(file);
	}

	for (const dir in directoryMap) {
		const folder = directoryMap[dir];
		const tracksMetadata = [];
		let allHaveMeta = true;
		let consistentAlbumName = null;

		// Pass 1: Validate Metadata for the folder
		for (const file of folder.audio) {
			try {
				const metadata = await mm.parseBlob(file);
				const albumName = metadata.common.album;

				if (!albumName) {
				allHaveMeta = false;
				} else if (consistentAlbumName === null) {
				consistentAlbumName = albumName;
				} else if (consistentAlbumName !== albumName) {
				allHaveMeta = false; // Different albums in same folder
				}

				tracksMetadata.push({ file, metadata, albumName });
			} catch {
				allHaveMeta = false;
			}
			
			processed++;
			self.postMessage({ type: 'PROGRESS', percent: (processed / totalFiles) * 100 });
		}

		// Pass 2: Decide - Create Album or "Loose Tracks"
		const shouldCreateAlbum = allHaveMeta && consistentAlbumName && folder.audio.length > 0;
		
		let coverPath = null;
		if (shouldCreateAlbum && folder.images.length > 0) {
			coverPath = folder.images.sort((a, b) => b.size - a.size)[0].path;
		}

		self.postMessage({
			type: 'IMPORT_BATCH',
			data: {
				createAlbum: shouldCreateAlbum,
				albumName: consistentAlbumName,
				artist: tracksMetadata[0]?.metadata.common.artist || 'Unknown',
				cover: coverPath,
				tracks: tracksMetadata.map(t => ({
				path: t.file.path,
				title: t.metadata.common.title || t.file.name,
				duration: Math.round(t.metadata.format.duration),
				trackNo: t.metadata.common.track.no
				}))
			}
		});
	}

	self.postMessage({ type: 'SCAN_COMPLETE' });
};
