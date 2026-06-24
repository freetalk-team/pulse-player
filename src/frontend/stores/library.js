import { writable, get, derived } from 'svelte/store';

import { confirmAction } from './ui';
import { selectFilter, selectedAlbum } from './player';
import { enqueueTracks, recent, queue } from './play';
import { createPlaylist, playlists, playlistCount, loadPlaylists } from './playlist';
import { audioCount, videoCount, tracks, initTracks } from './tracks';
import { playsets, playsetCount, loadPlaysets } from './playsets';

// export const tracks = writable([]);
export const albums = writable([]);
export const albumCount = writable(0);

export const customGenres = writable([]);

api.on('import-album', album => {

	console.debug('Adding album:', album);

	albums.update(list => {
		let found = false;

		const updated = list.map(a => {
			if (a.id === album.id) {
				found = true;
				return {
					...a,
					genre: album.genre,
					year: album.year,
					cover_path: album.cover_path
				};
			}

			return a;
		});

		if (found)
			return updated;

		albumCount.update(n => n + 1);

		return [...updated, album];
	});
});

export const defaultGenres = [
    'Jazz', 'Electronic', 'Blues', 
    'Classical', 'Lo-Fi', 'Workout', 'Chill', 'Deep House', 'Reggae', 
    'Soul', 'Synthwave', 'Indie', 'Alternative', 'R&B', 
    'Techno', 'Ambient', 'Punk', 'Disco', 'Dubstep', 'Funk',
    'Hardstyle', 'House', 'Latin', 'Opera', 'Psytrance', 
    'Trap', 'Vaporwave', 'World'

	// pop
	, 'Pop', 'Pop Folk',  'K-Pop', 'Alternative Pop'

	// folk
	, 'Folk', 'YU Folk', 'BG Folk', 'Turbo Folk', 'Country'

	// rock
	, 'Rock', 'Rock & Roll', 'Hard Rock', 'Progressive Rock', 'Classic Rock',  'Alternative Rock'

	// metal
	, 'Metal', 'Thrash Metal', 'Grunge'

	// rap
	, 'Hip Hop', 'Rap'

].sort();

export const allAvailableGenres = derived(
	[customGenres],
	([$customGenres]) => [...defaultGenres, ...$customGenres].sort()
);

export async function loadCustomGenres() {
	if (window.api?.getCustomGenres) {
		const savedGenres = await window.api.getCustomGenres();
		customGenres.set(savedGenres);
	}
}

export async function saveNewCustomGenre(genre) {
	// 1. Optimistic update in Svelte
	customGenres.update(prev => {
		if (!prev.includes(genre) && !defaultGenres.includes(genre)) {
			return [...prev, genre];
		}
		return prev;
	});

	// 2. Persist to electron-store via IPC
	await window.api.saveCustomGenre(genre);
}

export async function loadLibrary() {
	const { video_count, audio_count, album_count, playlist_count, playset_count } = await api.getLibrary();

	initTracks(audio_count, video_count);

	await loadPlaylists(playlist_count);
	await loadPlaysets(playset_count);
	await loadAlbums(album_count);
	await loadRecentTracks();

	await loadCustomGenres();
}

async function loadAlbums(count) {
	const data = await api.getAlbums();
	albums.set(data);

	albumCount.set(count);

	// console.debug('Loaded albums:', data);
};


async function loadRecentTracks() {
	const data = await api.getRecentTracks();
	recent.set(data);

	return data;
}

export async function playAlbum(album) {

	if (!album)
		album = get(selectedAlbum);

	const tracks = await api.getAlbumTracks(album.id);

	if (!tracks || tracks.length === 0) return;

	await api.updateLastPlayedAlbum(album.id);

	enqueueTracks(tracks);

	albums.update(list => {

		const index = list.findIndex(a => a.id === album.id);

		if (index == -1) return [album, ...list];
		if (index == 0) return list;

		list.splice(index, 1);

		return [album, ...list];
	});
}

export async function deleteAlbum(album) {

	if (!album)
		album = get(selectedAlbum);

	const confirmed = await confirmAction({
		title: 'Delete Album?',
		message: `This will permanently remove "${album.name}". Your music files won't be touched.`,
		confirmText: 'Delete',
		danger: true
	});

	if (confirmed) {
		// Only now do we call the SQLite delete
		await api.deleteAlbum(album.id);

		selectFilter('all');

		albums.update(list => list.filter(p => p.id !== album.id));
	}

}

export async function createPlaylistFromRecent() {

	const tracks = get(recent);

	await createPlaylist('My playlist', tracks, true);
}

export async function clearLibrary() {

	const confirmed = await confirmAction({
		title: 'Delete library?',
		message: `This will permanently remove tracks, albums, playlist and playsets. Your music files won't be touched.`,
		confirmText: 'Delete',
		danger: true
	});

	if (!confirmed)
		return;

	await api.clearLibrary();

	audioCount.set(0);
	videoCount.set(0);
	playlistCount.set(0);
	playsetCount.set(0);
	albumCount.set(0);

	tracks.set([]);
	albums.set([]);
	playlists.set([]);
	playsets.set([]);

	recent.set([]);
	queue.set([]);

	selectFilter('all');
}
