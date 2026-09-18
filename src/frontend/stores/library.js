import { writable, get, derived } from 'svelte/store';

import { confirmAction } from './ui';
import { selectFilter, selectedAlbum } from './player';
import { enqueueTracks, recent, queue } from './play';
import { tracks } from './tracks';
import { createPlaylist, clearPlaylists } from './playlist';
import { clearPlaysets } from './playsets';
import { clearAlbums } from './albums';
import { currentLayout } from './ui';


export const audioCount = writable(0);
export const videoCount = writable(0);
export const trackCount = derived(
    [audioCount, videoCount],
    ([$audioCount, $videoCount]) => $audioCount + $videoCount
);
export const albumCount = writable(0);
export const playlistCount = writable(0);
export const playsetCount = writable(0);
export const genres = writable([]);


api.on('import-progress', (progress) => {
	const added = progress.tracks;

	const audio = added.filter(t => t.type == 'audio').length;
	const video = added.length - audio;

	audioCount.update(n => n + audio);
	videoCount.update(n => n + video);
});

api.on('track:added', track => {
	const store = track.type == 'video' ? videoCount : audioCount;
	store.update(n => n + 1);
});

export async function loadLibrary() {
	const stat = await api.getLibraryStat();

	audioCount.set(stat.audio_count);
	videoCount.set(stat.video_count);
	albumCount.set(stat.album_count);
	playlistCount.set(stat.playlist_count);
	playsetCount.set(stat.playset_count);

	await loadGenres();
}

export async function loadGenres() {
	const all = await api.getGenres();
	genres.set(all);
}

export async function addGenre(genre) {
	await api.addGenre(genre);
	genres.update(v => [...v, genre]);
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

	clearAlbums();
	clearPlaylists();
	clearPlaysets();

	tracks.set([]);

	recent.set([]);
	queue.set([]);

	selectFilter('all');

	currentLayout.set('home');
}
