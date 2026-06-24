import { basename } from 'node:path';

export function normalizePaths(tracks) {

	if (Array.isArray(tracks)) {
		for (const i of tracks)
			normalize(i);

		return tracks;
	}

	return normalize(tracks);

	function normalize(track) {
		track.mime = track.path.slice(track.path.lastIndexOf('.') + 1).toLowerCase();
		track.path = `/media/${track.id}`;

		if (track.thumb_path) {
			const filename = basename(track.thumb_path);

			track.thumb_path = `/thumb/${filename}`;
		}

		return track;
	}
}

export function normalizeCoverPaths(sets) {

	if (Array.isArray(sets)) {
		for (const i of sets)
			normalize(i);

		return sets;
	}

	return normalize(sets);

	function normalize(set) {
		if (set.cover_path) {
			const filenames = set.cover_path.split(',');
			set.cover_path = filenames.map(i => `/thumb/${basename(i)}`).join(',');
		}

		return set;
	}
}