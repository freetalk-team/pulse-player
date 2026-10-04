
import { join, isAbsolute, basename, parse } from 'node:path';

import store from '../store';

export class Path {

	static localThumbPaths(tracks) {
		for (const t of tracks)
			this.localThumbPath(t);

		return tracks;
	}

	static localTrackPaths = this.localThumbPaths;

	static localThumbPath(track) {
		if (track.thumb_path && !isAbsolute(track.thumb_path))
			track.thumb_path = localThumbPath(track.thumb_path);

		return track;
	}

	static remoteTrackPaths(tracks) {
		for (const t of tracks) {

			const { name, ext } = parse(t.path);

			t.path = `/media/${t.id}`;
			t.mime = ext.substring(1).toLowerCase();

			if (t.thumb_path)
				t.thumb_path = remoteThumbPath(t.thumb_path);
		}

		return tracks;
	}

	static remoteThumbPath(track, url='') {
		if (track.thumb_path)
			track.thumb_path = remoteThumbPath(track.thumb_path, url);
	}

	static localCoverPaths(albums) {
		for (const a of albums) 
			this.localCoverPath(a);

		return albums;
	}

	static localCoverPath(album) {
		if (album.cover_path)
			album.cover_path = album.cover_path
				.split(',')
				.unique()
				.map(i => localThumbPath(i))
				.join(',');

		return album;
	}

	static remoteCoverPaths(albums, url='') {
		for (const a of albums) 
			this.remoteCoverPath(a, url);

		return albums;
	}

	static remoteCoverPath(album, url='') {
		if (album.cover_path)
			album.cover_path = remoteCoverPath(album.cover_path, url);

		return album;
	}

	static localImagePath(site) {
		if (site.image)
			site.image = join(store.imageCacheDir, site.image);

		return site;
	}

	static remoteImagePath(site, url='') {
		if (site.image)
			site.image = remoteImagePath(site.image, url);

		return site;
	}

	static localPath(item, type=item.type) {
		switch (type) {

			case 'track':
			this.localThumbPath(item);
			break;

			case 'radio':
			this.localFaviconPath(item);
			break;

			case 'link':
			this.localImagePath(item);
			break;

			default:
			this.localCoverPath(item);
			break;
		}

		return item;
	}

	static remotePath(item, url='', type=item.type) {
		switch (type) {
			case 'track':
			item.path = url + item.path;
			this.remoteThumbPath(item, url);
			break;

			case 'album':
			case 'playlist':
			case 'playset':
			this.remoteCoverPath(item, url);
			break;

			case 'radio':
			this.remoteFaviconPath(item, url);
			break;

			case 'link':
			this.remoteImagePath(item, url);
			break;
		}

		return item;
	}

	static localFaviconPath(station) {
		if (station.favicon)
			station.favicon = join(store.thumbRadioDir, station.favicon);
	}

	static remoteFaviconPath(station, url='') {
		if (station.favicon)
			station.favicon = remoteFaviconPath(station.favicon, url);
	}


	static normalizePaths(tracks) {

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

				track.thumb_path = `${filename}`;
			}

			return track;
		}
	}

	static normalizeCoverPaths(sets) {

		if (Array.isArray(sets)) {
			for (const i of sets)
				normalize(i);

			return sets;
		}

		return normalize(sets);

		function normalize(set) {
			if (set.cover_path) {
				const filenames = set.cover_path.split(',');
				set.cover_path = filenames.map(i => `${basename(i)}`).join(',');
			}

			return set;
		}
	}

	static normalizeFaviconPath(station) {
		if (station.favicon)
			station.favicon = `${basename(station.favicon)}`;
	}

	static normalizeImagePath(site) {
		if (site.image)
			site.image = `${basename(site.image)}`;
	}

	static normalizePath(item, type=item.type) {
		switch (type) {
			case 'track':
			this.normalizePaths(item);
			break;

			case 'album':
			case 'playlist':
			case 'playset':
			this.normalizeCoverPaths(item);
			break;

			case 'radio':
			this.normalizeFaviconPath(item);
			break;

			case 'link':
			this.normalizeImagePath(item);
			break;
		}

		return item;
	}
}

function localThumbPath(path) {
	return join(store.thumbDir, path);
}

function remoteThumbPath(path, url) {
	return url + (isAbsolute(path) ? path : `/thumb/${path}`);
}

function remoteFaviconPath(path, url) {
	return url + (isAbsolute(path) ? path : `/thumb/radio/${path}`);
}

function remoteImagePath(path, url) {
	return url + (isAbsolute(path) ? path : `/thumb/image/${path}`);
}

function remoteCoverPath(path, url) {
	return path.split(',')
		.map(i => remoteThumbPath(i, url))
		.join(',');

}