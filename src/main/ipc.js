
import { dialog, ipcMain } from 'electron';

// import loudness from 'loudness';

import db from './db';
import store from './store';
import discovery from './discovery';
import client from './client';
import { broadcast } from './server/clients';

import { Scanner } from './scanner';
import { normalizeCoverPaths, normalizePaths } from './server/routes/common';


export function setupIpcHandlers(handler) {

	

	// File open
	ipcMain.handle('dialog:open-directory', async () => {
		// Note: Only macOS ✅ supports both (files and dirs)

		const { canceled, filePaths } = await dialog.showOpenDialog({
			title: 'Select audio folders',
			//properties: ['openFile', 'openDirectory', 'multiSelections']
			properties: ['openDirectory', 'multiSelections']
		});
		
		if (canceled) return [];
		return filePaths; // These are absolute paths!
	});

	ipcMain.handle('dialog:open-file', async () => {

		const { canceled, filePaths } = await dialog.showOpenDialog({
			title: 'Select audio files',
			properties: ['openFile', 'multiSelections']
		});
		
		if (canceled) return [];
		return filePaths; // These are absolute paths!
	});

	ipcMain.handle('db:get-collections', async (event, collections, { query, sort, id, offset, limit }) => {
		// console.log('Fetching collection:', collections, query, sort, offset);
		return db.getCollections(collections, query, sort, id, offset, limit);
	});

	ipcMain.handle('db:get-top', async (event, { collection, limit }) => {
		return db.getTop(collection, limit);
	});

	// Tracks
	ipcMain.handle('db:get-library', () => {
		return db.getLibraryStat();
	});

	ipcMain.handle('db:get-tracks', async (event, { filter, query, playlistId, sort, limit, offset }) => {
		return db.getTracks(filter, query, playlistId, sort, offset, limit);
	});

	ipcMain.handle('db:get-recent-tracks', async (event, { limit, offset }) => {
		return db.getRecentTracks(offset, limit);
	});

	ipcMain.handle('search-tracks', (event, query) => {
		return db.searchTracks(query);
	});

	ipcMain.handle('db:increment-track-rating', async (event, trackId) => {
		return db.incrementRating(trackId);
	});

	ipcMain.handle('db:update-last-played', async (event, trackId) => {
		return db.updateLastPlayed(trackId);
	});


	// Albums
	ipcMain.handle('db:get-album-tracks', async (event, albumId) => {
		return db.getAlbumTracks(albumId);
	});

	ipcMain.handle('db:update-last-played-album', async (event, albumId) => {
		return db.updateLastPlayed(albumId, 'albums');
	});

	// Playlists
	ipcMain.handle('db:get-playlist', async (event, id) => {
		return db.get(id, 'playlist');
	});

	ipcMain.handle('db:save-playlist', async (event, { id, name, tracks }) => {
		return db.savePlaylist(id, name, tracks);
	});

	ipcMain.handle('db:update-playlist-tracks-order', async (event, { id, tracks, purge }) => {
		return db.updatePlaylistOrder(id, tracks, purge);
	});

	ipcMain.handle('db:update-last-played-playlist', async (event, playlistId) => {
		return db.updateLastPlayed(playlistId, 'playlists');
	});

	ipcMain.handle('db:get-playlist-tracks', async (event, playlistId) => {
		return db.getPlaylistTracks(playlistId);
	});

	ipcMain.handle('db:delete-playlist', async (event, playlistId) => {
		// const result = await dialog.showMessageBox({
		// 	type: 'warning',
		// 	buttons: ['Cancel', 'Delete'],
		// 	defaultId: 0,
		// 	title: 'Confirm Deletion',
		// 	message: 'Are you sure you want to delete this playlist?',
		// 	detail: 'This action cannot be undone, but your music files will remain safe.',
		// 	cancelId: 0,
		// });

		// if (result.response === 1) { // User clicked 'Delete'
		// 	db.deletePlaylist(playlistId);
		// 	return true;
		// }

		// return false;
		return db.deletePlaylist(playlistId);
	});

	ipcMain.handle('db:rename-playlist', async (event, { id, name }) => {
		return db.renamePlaylist(id, name);
	});

	ipcMain.handle('db:update-playlist-metadata', async (event, { id, icon, icon_color, genre }) => {
		return db.updatePlaylistMetadata(id, icon, icon_color, genre);
	});

	ipcMain.handle('db:get-playlist-previews', async () => {
		return db.getPlaylistPreviews();
	});

	ipcMain.handle('db:get-playset-members', async (event, playsetId) => {
		return db.getPlaysetMembers(playsetId);
	});

	ipcMain.handle('db:get-component', async (event, id) => {
		return db.get(id, 'components');
	});

	ipcMain.handle('db:get-components', async (event) => {
		return db.getComponents();
	});

	ipcMain.handle('db:update-components-priority', (event, components) => {
		return db.updateComponentsPriority(components);
	});

	ipcMain.handle('db:save-component', (event, component) => {
		return db.saveComponent(component);
	});

	ipcMain.handle('db:delete-component', (event, id) => {
		return db.deleteComponent(id);
	});

	ipcMain.handle('db:enable-component', (event, id, enable) => {
		return db.enableComponent(id, enable);
	});

	ipcMain.handle('db:add-post', (event, { type, item, content }) => {
		const post = db.addPost(discovery.id, type, item, content );

		switch (type) {
			case 'track':
			normalizePaths(item);
			break;

			case 'album':
			case 'playlist':
			normalizeCoverPaths(item);
			break;
		}

		Object.assign(post, {
			user_id: discovery.id,
			username: store.get('username'),
			comments_count: 0
		});

		broadcast('home', 'post:create', { type, item, content, ...post });

		return post;
	});

	ipcMain.handle('db:delete-post', (event, id) => {
		return db.deletePost(id);
	});

	ipcMain.handle('db:get-posts', (event, { offset, limit }) => {
		return db.getPosts(offset, limit);
	});

	ipcMain.handle('db:get-comments', (event, postId) => {
		return db.getComments(postId);
	});

	ipcMain.handle('db:add-comment', (event, { content, postId, parentId }) => {
		const res = db.addComment(content, postId, parentId, discovery.id);

		Object.assign(res, {
			user_id: discovery.id,
			username: store.get('username')
		});

		const comment = Object.assign({}, res, {
			content,
			post_id: postId,
			parent_comment_id: parentId
		});

		broadcast('home', 'comment:added', comment);

		return res;
	});

	ipcMain.handle('db:clear-library', () => {
		return db.clearLibrary();
	});


	// Remote methods
	ipcMain.handle('connect-remote', async (event, remoteId) => {
		await client.acquire(remoteId);

		client.send(remoteId, 'subscribe', { channel: 'home' });
	});

	ipcMain.handle('disconnect-remote', (event, remoteId) => {
		return client.release(remoteId);
	});

	ipcMain.handle('get-tracks', async (event, query, remoteId) => {
		const remote = discovery.getRemote(remoteId);

		if (!remote) return [];

		const params = new URLSearchParams(Object.clean(query));
		const url = baseUrl(remote);

		console.debug('[IPC] get tracks:', params);

		try {
			const res = await fetch(`${url}/api/tracks?${params.toString()}`);
			const tracks = await res.json();

			for (const i of tracks) {
				i.remote = remoteId;
				i.path = url + i.path;

				if (i.thumb_path)
					i.thumb_path = url + i.thumb_path;
			}

			return tracks;

		}
		catch (e) {
			console.error('🚨 Failed to fetch remote tracks:', e);
		}

		return [];
	});

	ipcMain.handle('get-collections', async (event, collection, query, remoteId) => {
		const remote = discovery.getRemote(remoteId);

		if (!remote) return [];

		const params = new URLSearchParams(Object.clean(query));
		const url = baseUrl(remote);

		console.debug('[IPC] get collection:', collection, params);

		try {
			const res = await fetch(`${url}/api/collection/${collection}?${params.toString()}`);
			const sets = await res.json();

			for (const i of sets) {

				i.remote = remoteId;

				if (i.cover_path)
					i.cover_path = url + i.cover_path;
			}

			return sets;

		}
		catch (e) {
			console.error('🚨 Failed to fetch remote sets:', e);
		}

		return [];
	});

	ipcMain.handle('get-posts', async (event, { offset, limit, remoteId }) => {

		const remote = discovery.getRemote(remoteId);

		if (!remote) return [];

		const url = baseUrl(remote);


		try {

			const res = await fetch(`${url}/api/post?offset=${offset}&limit=${limit}`);
			const posts = await res.json();

			console.debug('[IPC] get posts:', posts);

			for (const i of posts) {

				if (i.type == 'post') continue;

				const item = i.item;

				switch (i.type) {

					case 'track':

					item.path = url + item.path;

					if (item.thumb_path)
						item.thumb_path = url + item.thumb_path;
					break;

					default:
					if (item.cover_path)
						item.cover_path = url + item.cover_path;
					break;
				}
			}

			return posts;
		}
		catch (e) {
			console.error('🚨 Failed to fetch remote posts:', e);
		}

		return [];
	});

	ipcMain.handle('get-comments', async (event, postId, remoteId) => {

		const remote = discovery.getRemote(remoteId);

		if (!remote) return [];

		const url = baseUrl(remote);

		console.debug('[IPC] get comments', remoteId);

		try {

			const res = await fetch(`${url}/api/post/${postId}/comments`);
			const comments = await res.json();

			return comments;
		}
		catch (e) {
			console.error('🚨 Failed to fetch remote comments:', e);
		}

		return [];
	});

	ipcMain.handle('add-comment', async (event, { content, postId, parentId }, remoteId) => {

		try {

			const socket = client.getSocket(remoteId);

			if (socket) {

				const comment = {
					content,
					post_id: postId,
					parent_comment_id: parentId,
					user_id: discovery.id,
					username: store.get('username')
				};

				socket.sendMessage('comment:add', comment);
			}

		}
		catch (e) {
			console.error('Failed to send comment:', e);
		}
	});

	// // Set System Volume (0-100)
	// ipcMain.on('volume:set', async (event, value) => {
	// 	try {
	// 	await loudness.setVolume(value);
	// 	} catch (err) {
	// 	console.error('PulseAudio Error:', err);
	// 	}
	// });

	// // Get current System Volume on start
	// ipcMain.handle('volume:get', async () => {
	// 	try {
	// 	return await loudness.getVolume();
	// 	} catch (err) {
	// 	return 50; // Fallback
	// 	}
	// });

	const scanner = new Scanner(handler);

	ipcMain.handle('update-track', (event, track, opt) => {
		return scanner.updateTrack(track, opt);
	});

	ipcMain.handle('scan-folders', (event, paths) => {

		for (const path of paths)
			scanner.addFolder(path);
	});

	

	function importToDatabase(payload) {
		const { createAlbum, tracks } = payload;

		if (createAlbum) {
			db.addAlbum(payload);
		}
		else {
			db.addTracks(tracks);
		}

		//mainWindow.webContents.send('db:library-updated');
	}


}

function baseUrl(remote) {
	return `http://${remote.address}:${remote.port}`;
}

