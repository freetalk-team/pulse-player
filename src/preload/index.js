import { contextBridge, ipcRenderer, webUtils, shell } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const ipc = {
	send: (channel, data) => ipcRenderer.send(channel, data),
	invoke: (channel, ...data) => ipcRenderer.invoke(channel, ...data),
	on: (channel, func) => {
		//const subscription = (event, ...args) => func(event, ...args)
		const subscription = (event, ...args) => func(...args)
		ipcRenderer.on(channel, subscription)
		return () => ipcRenderer.removeListener(channel, subscription)
	}
}



function getCollections(collections, query, remoteId) {
	console.log('GET collections', collections, query);
	return remoteId
		? ipc.invoke('get-collections', collections, query, remoteId)
		: ipc.invoke('db:get-collections', collections, query);
}


function getSets(query) {
	return ipc.invoke('db:get-sets', query);
}

function getPlaysetMembers(playsetId) {
	return ipc.invoke('db:get-playset-members', playsetId);
}

let prefs;

async function getPrefs() {
	if (!prefs) {
		prefs = await ipc.invoke('get-prefs');

		console.debug('Loaded prefs:', prefs);
	}

	return prefs;
}

function getPref(key, defaultValue) {
	const parts = key.split('.');
	let obj = prefs;

	for (const p of parts) {
		if (obj == null || typeof obj !== 'object' || !(p in obj)) {
			return defaultValue;
		}

		obj = obj[p];
	}

	return obj;
}

function setPref(key, value) {
	if (typeof key == 'string') {

		const parts = key.split('.');
		let obj = prefs;

		for (let i = 0; i < parts.length - 1; i++) {
			const p = parts[i];

			if (typeof obj[p] !== 'object' || obj[p] === null) {
				obj[p] = {};
			}

			obj = obj[p];
		}

		obj[parts[parts.length - 1]] = value;

	}
	else {
		for (const [k, v] of Object.entries(key))
			prefs[k] = v;
	}

	return ipc.invoke('set-pref', key, value)
}


// 1. Define your custom API
const api = {
	isElectron: true,
	ipc,

	on: (...args) => ipc.on(...args),

	openExternal: (url) => shell.openExternal(url),
	getPathForFile: (file) => webUtils.getPathForFile(file), 
	dialogOpenDirectory: (defaultPath) => ipc.invoke('dialog:open-directory', defaultPath),
	dialogOpenFile: (defaultPath) => ipc.invoke('dialog:open-file', defaultPath),
	scanFolders: (paths, playlistId) => ipc.invoke('scan-folders', paths, playlistId),

	setPref,
	getPrefs,
	getPref,

	getLibraryStat() { return ipc.invoke('get-library-stat'); },
	clearLibrary()   { return ipc.invoke('clear-library'); },
	
	queryTracks(params, remoteId) { 
		return remoteId
			? ipc.invoke('query-remote-tracks', params, remoteId)
			: ipc.invoke('query-tracks', params); 
	},
	getRecentTracks(limit)    { return ipc.invoke('get-recent-tracks', limit); },
	updateLastPlayedTrack(track) { return ipc.invoke('update-last-played-track', track.id); },
	updateTrack(track, opt)   { return ipc.invoke('update-track', track, opt); },
	removeTrack(id, remove)   { return ipc.invoke('remove-track', id, remove); },
	fetchTrackMeta(track)     { return ipc.invoke('fetch-track-meta', track); },

	getAlbums(limit)          { return ipc.invoke('get-albums', limit); },
	queryAlbums(params)       { return ipc.invoke('query-albums', params); },
	getAlbumTracks(id, remoteId) { 
		return remoteId
			? ipc.invoke('get-remote-album-tracks', id, remoteId)
			: ipc.invoke('get-album-tracks', id); 
	},
	deleteAlbum(id)           { return ipc.invoke('delete-album', id); },

	getPlaylists(limit)       { return ipc.invoke('get-playlists', limit); },
	queryPlaylists(params)    { return ipc.invoke('query-playlists', params); },
	createPlaylist(playlist)  {
		if (playlist.tracks)
			playlist.tracks = playlist.tracks.map((track, index) => ({
				track_id: track.id,
				position: index
			}));

		return ipc.invoke('create-playlist', playlist); 
	},
	deletePlaylist(id)        { return ipc.invoke('delete-playlist', id); },
	updatePlaylist(id, data)  { return ipc.invoke('update-playlist', id, data); },
	getPlaylistTracks(id, remoteId) { 
		return remoteId
			? ipc.invoke('get-remote-playlist-tracks', id, remoteId)
			: ipc.invoke('get-playlist-tracks', id); 
	},
	updatePlaylistOrder(id, tracks, startIndex) {
		const [purge, start] = startIndex < 0 ? [true, 0] : [false, startIndex];
		const order = tracks.map((track, index) => ({
			track_id: track.id,
			position: index + start
		}));
		
		return ipc.invoke('update-playlist-order', id, order, purge); 
	
	},

	getSets,
	getPlaysets(limit)      { return ipc.invoke('get-playsets', limit); },
	queryPlaysets(params)   { return ipc.invoke('query-playsets', params); },
	getPlaysetMembers(id)   { return ipc.invoke('get-playset-members', id); },
	createPlayset(playset)  { 
		if (playset.members)
			playset.members = playset.members.map((member, index) => ({
				member_id: member.id,
				member_type: member.type,
				position: index
			}));

		return ipc.invoke('create-playset', playset); 
	},
	updatePlayset(id, data) { return ipc.invoke('update-playset', id, data); },
	deletePlayset(id)       { return ipc.invoke('delete-playset', id); },
	updatePlaysetOrder(id, members, startIndex) {
		const [purge, start] = startIndex < 0 ? [true, 0] : [false, startIndex];
		const order = members.map((member, index) => ({
			member_id: member.id,
			member_type: member.type,
			position: index + start
		}));

		return ipc.invoke('update-playset-order', id, order, purge); 
	},

	updateLastPlayed(id, type) { return ipc.invoke('update-last-played', id, type); },

	queryCollections(collection, params, remoteId) { 
		if (typeof collection == 'object') {
			remoteId = params;
			params = collection;
			collection = params.collection;
		}

		return remoteId
			? ipc.invoke('query-remote-collections', collection, params, remoteId)
			: ipc.invoke('query-collections', collection, params); 
	}, 

	getComponent(id)                  { return ipc.invoke('get-component', id); },
	getComponents()                   { return ipc.invoke('get-components'); },
	updateComponentsOrder(components) { return ipc.invoke('update-components-priority', components); },
	saveComponent(component)          { return ipc.invoke('save-component', component); },
	deleteComponent(id)               { return ipc.invoke('delete-component', id); },
	enableComponent(id, enable)       { return ipc.invoke('enable-component', id, enable); },

	addPost(type, item, content)  { return ipc.invoke('add-post', { type, item, content }); },
	deletePost(id)                { return ipc.invoke('delete-post', id); },
	getPosts(query, remoteId)     { return ipc.invoke('query-posts', query, remoteId); },
	getComments(postId, commentId, remoteId) { return ipc.invoke('get-comments', postId, commentId, remoteId); },
	addComment(comment, remoteId) { return ipc.invoke('add-comment', comment, remoteId); },
	addReaction(reaction, remote) { ipc.invoke('add-reaction', reaction, remote); },

	loadRemotePlayers()        { return ipc.invoke('remote-players'); },
	connectRemote(remoteId)    { return ipc.invoke('connect-remote', remoteId); },
	disconnectRemote(remoteId) { return ipc.invoke('disconnect-remote', remoteId); },

	getGenres()     { return ipc.invoke('get-genres'); },
	addGenre(genre) { return ipc.invoke('add-genre', genre); },

	loadFavouriteStations(limit)       { return ipc.invoke('get-favourite-stations', limit); },
	loadRecentStations(limit)          { return ipc.invoke('get-recent-stations', limit); },
	queryStations(params)              { return ipc.invoke('query-stations', params); },
	setStationFavourite(station) {
		return ipc.invoke('set-station-favourite', station.uuid, station.favourite); 
	},
	updateStation(id, data)            { return ipc.invoke('update-station', id, data); },
	updateLastPlayedStation(station)   { return ipc.invoke('update-last-played-station', station.id); },
	startRecording(stationId)     { return ipc.invoke('start-recording', stationId); },
	stopRecording(stationId)           { return ipc.invoke('stop-recording', stationId); },
	addRecording(recording)            { return ipc.invoke('add-recording', recording); },
	removeRecording(recordingId)       { return ipc.invoke('remove-recording', recordingId); },
	setRecordingActive(recordingId, active) { return ipc.invoke('set-recording-active', recordingId, active); },
	loadRecordings(stationId)          { return ipc.invoke('get-recordings', stationId); },

	download(type, item, opt) { return ipc.invoke('download', type, item, opt); },

	processLink(url) { return ipc.invoke('process-link', url); },

	getFeatures() { return ipc.invoke('get-features'); },
	async activatePro(code) { 
		const res = await ipc.invoke('activate-pro', code);
		if (res.success) {
			prefs.features = res.features;
		}

		return res;
	}
}

const platform = {
	resolve(path) { 
		return path.startsWith('http')
			? path
			: `media://${path}`;
	},

	resolveThumb(path) {
		return this.resolve(path);
	},

	play(element, path) {
		element.src = this.resolve(path);
		return element.play();
	}
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
