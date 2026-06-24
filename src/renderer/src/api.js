function getLibrary() {
	return window.api.ipcRenderer.invoke('db:get-library');
}

function getTracks(query) {
	return window.api.ipcRenderer.invoke('db:get-tracks', query);
}

function getRecentTracks(query) {
	return window.api.ipcRenderer.invoke('db:get-recent-tracks', { offset: 0, limit: 50 });
}

function updateLastPlayed(trackId) {
	return window.api.ipcRenderer.invoke('db:update-last-played', trackId);
}

function incrementTrackRating(trackId) {
	return window.api.ipcRenderer.invoke('db:increment-track-rating', trackId);
}

function getAlbums() {
	return window.api.ipcRenderer.invoke('db:get-albums');
}

function getAlbumTracks(albumId) {
	return window.api.ipcRenderer.invoke('db:get-album-tracks', albumId)
}

function deleteAlbum(albumId) {

}

function updateLastPlayedAlbum(albumId) {
	return window.api.ipcRenderer.invoke('db:update-last-played-album', albumId);
} 

function getPlaylists() {
	return window.api.ipcRenderer.invoke('db:get-playlists');
}

function savePlaylist(playlist) {
	return window.api.ipcRenderer.invoke('db:save-playlist', playlist);
}

function deletePlaylist(playlistId) {
	return window.api.ipcRenderer.invoke('db:delete-playlist', playlistId);
}

function renamePlaylist(id, name) {
	return window.api.ipcRenderer.invoke('db:rename-playlist', { id, name });
}

function getPlaylistTracks(playlistId) {
	return window.api.ipcRenderer.invoke('db:get-playlist-tracks', playlistId);
}

function updateLastPlayedPlaylist(playlistId) {
	return window.api.ipcRenderer.invoke('db:update-last-played-playlist', playlistId);
} 

function getCustomGenres() {
	return window.api.getCustomGenres();
}

function saveCustomGenre(genre) {
	window.api.saveCustomGenre(genre);
}

function updatePlaylistMetadata(meta) {
	return window.api.ipcRenderer.invoke('db:update-playlist-metadata', meta);
}

function updatePlaylistOrder(id, tracks) {
	return window.api.ipcRenderer.invoke('db:update-playlist-tracks-order', { id, tracks });
}

function loadPlaylistPreviews() {
	return window.api.ipcRenderer.invoke('db:get-playlist-previews');
}

function getSets(query) {
	return window.api.ipcRenderer.invoke('db:get-sets', query);
}

function getPlaysets() {
	return window.api.ipcRenderer.invoke('db:get-playsets');
}

function getPlaysetMembers(playsetId) {
	return window.api.ipcRenderer.invoke('db:get-playset-members', playsetId);
}

function setPref(name, val) {
	window.api.setPref(name, val);
}

let prefs;

async function getPrefs() {
	if (!prefs)
		prefs = await window.api.getPrefs();

	return prefs;
}

export default {
	setPref,
	getPrefs,

	getLibrary,
	getTracks,
	getRecentTracks,
	updateLastPlayed,
	incrementTrackRating,

	getAlbums,
	getAlbumTracks,
	deleteAlbum,
	updateLastPlayedAlbum,

	getPlaylists,
	savePlaylist,
	deletePlaylist,
	renamePlaylist,
	getPlaylistTracks,
	updatePlaylistMetadata,
	updatePlaylistOrder,
	updateLastPlayedPlaylist,
	loadPlaylistPreviews,

	getSets,
	getPlaysets,
	getPlaysetMembers,

	getCustomGenres,
	saveCustomGenre,
}