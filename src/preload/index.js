import { contextBridge, ipcRenderer, webUtils, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const ipc = {
	send: (channel, data) => ipcRenderer.send(channel, data),
	on: (channel, func) => {
		//const subscription = (event, ...args) => func(event, ...args)
		const subscription = (event, ...args) => func(...args)
		ipcRenderer.on(channel, subscription)
		return () => ipcRenderer.removeListener(channel, subscription)
	},
	invoke: (channel, ...data) => ipcRenderer.invoke(channel, ...data)
}

function getLibrary() {
	return ipc.invoke('db:get-library');
}

function getAlbums() {
	return ipc.invoke('db:get-top', { collection: 'album', limit: 16 });
}

function getPlaysets() {
	return ipc.invoke('db:get-top', { collection: 'playset', limit: 16 });
}

function getPlaylists() {
	return ipc.invoke('db:get-top', { collection: 'playlist', limit: 16 });
}

function getCollections(collections, query, remoteId) {
	console.log('GET collections', collections, query);
	return remoteId
		? ipc.invoke('get-collections', collections, query, remoteId)
		: ipc.invoke('db:get-collections', collections, query);
}

function clearLibrary() {
	return ipc.invoke('db:clear-library');
}

function getTracks(query, remoteId) {
	return remoteId
		? ipc.invoke('get-tracks', query, remoteId)
		: ipc.invoke('db:get-tracks', query);
}

function getRecentTracks(query) {
	return ipc.invoke('db:get-recent-tracks', { offset: 0, limit: 50 });
}

function updateTrack(track, opt) {
	return ipc.invoke('update-track', track, opt);
}

function updateLastPlayed(track) {
	return ipc.invoke('db:update-last-played', track.id);
}

function incrementTrackRating(trackId) {
	return ipc.invoke('db:increment-track-rating', trackId);
}


function getAlbumTracks(albumId) {
	return ipc.invoke('db:get-album-tracks', albumId)
}

function deleteAlbum(albumId) {

}

function updateLastPlayedAlbum(albumId) {
	return ipc.invoke('db:update-last-played-album', albumId);
} 

function getPlaylist(id) {
	return ipc.invoke('db:get-playlist', id);
}

function savePlaylist(playlist) {
	return ipc.invoke('db:save-playlist', playlist);
}

function deletePlaylist(playlistId) {
	return ipc.invoke('db:delete-playlist', playlistId);
}

function renamePlaylist(id, name) {
	return ipc.invoke('db:rename-playlist', { id, name });
}

function getPlaylistTracks(playlistId) {
	return ipc.invoke('db:get-playlist-tracks', playlistId);
}

function updateLastPlayedPlaylist(playlistId) {
	return ipc.invoke('db:update-last-played-playlist', playlistId);
} 

function updatePlaylistMetadata(meta) {
	return ipc.invoke('db:update-playlist-metadata', meta);
}

function updatePlaylistOrder(id, tracks, purge) {
	return ipc.invoke('db:update-playlist-tracks-order', { id, tracks, purge });
}

function loadPlaylistPreviews() {
	return ipc.invoke('db:get-playlist-previews');
}

function getSets(query) {
	return ipc.invoke('db:get-sets', query);
}

function getPlaysetMembers(playsetId) {
	return ipc.invoke('db:get-playset-members', playsetId);
}

function createPlayset(name) {

}

function addPlaysetMemeber(playsetId, member) {

}

function getComponent(id) {
	return ipc.invoke('db:get-component', id);
}

function getComponents() {
	return ipc.invoke('db:get-components');
}

function updateComponentsOrder(components) {
	return ipc.invoke('db:update-components-priority', components);
}

function saveComponent(component) {
	return ipc.invoke('db:save-component', component);
}

function deleteComponent(id) {
	return ipc.invoke('db:delete-component', id);
}

function enableComponent(id, enable) {
	return ipc.invoke('db:enable-component', id, enable);
}

function addPost(type, item, content) {
	return ipc.invoke('db:add-post', { type, item, content });
}

function deletePost(post) {
	return ipc.invoke('db:delete-post', post.id);
}

function getPosts(offset, limit, remoteId) {
	return remoteId
		? ipc.invoke('get-posts', { offset, limit, remoteId })
		: ipc.invoke('db:get-posts', { offset, limit });
	
}

function getComments(postId, remoteId) {
	return remoteId
		? ipc.invoke('get-comments', postId, remoteId)
		: ipc.invoke('db:get-comments', postId);
}

function addComment(content, postId, parentId, remoteId) {

	const comment = { content, postId, parentId };

	return remoteId
		? ipc.invoke('add-comment', comment, remoteId)
		: ipc.invoke('db:add-comment', comment);
}

function connectRemote(remoteId) {
	return ipc.invoke('connect-remote', remoteId);
}

function disconnectRemote(remoteId) {
	return ipc.invoke('disconnect-remote', remoteId);
}

let prefs;

async function getPrefs() {
	if (!prefs)
		prefs = await ipc.invoke('get-prefs');

	return prefs;
}

function getPref(key) {
	return prefs[key];
}

function setPref(key, value) {
	return ipc.invoke('set-pref', key, value)
}

function getCustomGenres() {
	return ipc.invoke('get-custom-genres');
}

function saveCustomGenre(genre) {
	return ipc.invoke('save-custom-genre', genre);
}

function loadRemotePlayers() {
	return ipc.invoke('remote-players');
}

// 1. Define your custom API
const api = {
	isElectron: true,
	ipc,

	on: (...args) => ipc.on(...args),
		

	openExternal: (url) => shell.openExternal(url),
	getPathForFile: (file) => webUtils.getPathForFile(file), 
	dialogOpenDirectory: () => ipc.invoke('dialog:open-directory'),
	dialogOpenFile: () => ipc.invoke('dialog:open-file'),
	scanFolders: (paths, playlistId) => ipc.invoke('scan-folders', paths, playlistId),

	setPref,
	getPrefs,
	getPref,

	getLibrary,
	getCollections,
	clearLibrary,
	
	getTracks,
	getRecentTracks,
	updateLastPlayed,
	incrementTrackRating,
	updateTrack,

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
	createPlayset,
	addPlaysetMemeber,

	getComponent,
	getComponents,
	saveComponent,
	deleteComponent,
	enableComponent,
	updateComponentsOrder,

	addPost,
	deletePost,
	getPosts,
	getComments,
	addComment,

	connectRemote,
	disconnectRemote,

	getCustomGenres,
	saveCustomGenre,

	loadRemotePlayers,
}

const platform = {
	resolve(path) { 
		return path.startsWith('http')
			? path
			: `media://${path}`;
	}

	, import: true
}


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld('electron', electronAPI)
		contextBridge.exposeInMainWorld('isElectron', true) 
		contextBridge.exposeInMainWorld('api', api)
		contextBridge.exposeInMainWorld('platform', platform)
	} catch (error) {
		console.error(error)
	}
} else {
	window.electron = electronAPI
	window.isElectron = true
	window.api = api
	window.platform = platform
}
