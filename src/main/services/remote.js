import store from '../store';

import discovery from './discovery';
import client from './client';

import { events } from "../events";

import { RemoteDatabase } from "../db/remote";
import { processLink } from '../utils/link';

import { normalizeCoverPaths, normalizePaths, normalizeFaviconPath } from '../server/routes/common';

class RemoteService {

	static instance = new RemoteService;

	#db = new RemoteDatabase;

	init() {
		this.#db.init(store);
	}

	destroy() {
		this.#db.close();
	}

	connect(remoteId) {
		return client.startWatch(remoteId);
	}

	disconnect(remoteId) {
		client.stopWatch(remoteId);
	}

	updateUser(id, name, photo) {
		this.#db.updateUser(id, name, photo);
	}

	async queryPosts(params, remoteId, uid) {

		uid = uid || discovery.id;

		if (!params.created_at) {
			params.offset = params.offset ?? 0;
			params.limit = params.limit || 20;
		}

		if (!remoteId) 
			return this.#db.queryUserPosts(params, uid);

		const remote = discovery.getRemote(remoteId);
		if (!remote) return [];

		const baseUrl = remoteUrl(remote);

		try {

			const url = new URL(baseUrl);

			url.pathname= '/api/post';
			url.searchParams.append('uid', uid);
			
			if (params.created_at) {
				url.searchParams.append('created_at', params.created_at);
			} else {
				url.searchParams.append('offset', params.offset.toString());
				url.searchParams.append('limit', params.limit.toString());
			}

			const res = await fetch(url);
			const posts = await res.json();

			console.debug('[REMOTE] get posts:', params, url.toString(), posts.length);

			for (const i of posts) {

				if (i.type == 'post') continue;

				const item = i.item;
				item.remote = remoteId;

				switch (i.type) {

					case 'track':

					item.path = baseUrl + item.path;

					if (item.thumb_path)
						item.thumb_path = baseUrl + item.thumb_path;
					break;

					default:
					if (item.cover_path)
						item.cover_path = remoteCoverPath(baseUrl, item.cover_path);
					
					break;
				}
			}

			return posts;
		}
		catch (e) {
			console.error('🚨 Failed to fetch remote posts:', e);
		}

		return [];
	}

	addPost(post) {
		console.debug('[REMOTE] adding post:', post);

		const { type, item } = post;
		const { username } = discovery.remote;

		post.uid = discovery.id;
		post.username = username;
		post.comments_count = 0;
		post.reaction_count = 0;

		const res = this.#db.add(post);

		switch (type) {
			case 'track':
			normalizePaths(item);
			break;

			case 'album':
			case 'playlist':
			case 'playset':
			normalizeCoverPaths(item);
			break;

			case 'radio':
			normalizeFaviconPath(item);
			break;
		}

		Object.assign(post, res);

		console.debug('[REMOTE] Sharing:', post);

		client.broadcast('home', 'post:create', post);

		return res;
	}

	deletePost(id) {
		this.#db.delete(id);

		// todo: boradcast
	}

	async getComments(postId, commentId, remoteId, uid) {

		uid = uid || discovery.id;

		if (!remoteId)
			return this.#db.getUserComments(postId, commentId, uid);

		const remote = discovery.getRemote(remoteId);
		if (!remote) return [];

		const baseUrl = remoteUrl(remote);
		const route = commentId
			? `/replies/${commentId}`
			: `/comments/${postId}`;

		console.debug('[REMOTE] get comments', remoteId);

		const url = new URL(baseUrl);

		url.pathname = '/api/post' + route;
		url.searchParams.append('uid', uid);

		try {
			const res = await fetch(url);
			const comments = await res.json();

			return comments;
		}
		catch (e) {
			console.error('🚨 Failed to fetch remote comments:', e);
		}

		return [];
	}

	async getReplies(commentId, remoteId) {

		if (!remoteId)
			return this.#db.getUserComments(null, commentId, discovery.id);

		const remote = discovery.getRemote(remoteId);
		if (!remote) return [];

		uid = uid || discovery.id;

		const baseUrl = remoteUrl(remote);
		const url = new URL(baseUrl);

		url.pathname = `/api/post/replies/${commentId}`;
		url.searchParams.append('uid', uid);

		console.debug('[REMOTE] get comments', remoteId);

		try {

			const res = await fetch(url);
			const comments = await res.json();

			return comments;
		}
		catch (e) {
			console.error('🚨 Failed to fetch remote comments:', e);
		}

		return [];
	}

	async addComment(comment, remoteId) {

		const { username } = discovery.remote;

		comment.uid = comment.uid || discovery.id;
		comment.username = comment.username || username;
		comment.replies_count = 0;
		comment.reaction_count = 0;


		if (remoteId) {
			try {
				await client.send(remoteId, 'comment:add', comment);
			}
			catch (e) {
				console.error('Failed to send comment:', e);
			}
		}
		else {


			const res = this.#db.addComment(comment);
			Object.assign(comment, res);

			const notify = comment.parent_uid && comment.parent_uid != comment.uid && comment.parent_uid != discovery.id ? [comment.parent_uid] : [];
			client.broadcast('home', 'comment:added', comment, notify);

			res.username = comment.username;
			res.uid = comment.uid;

			return res;
		}
	}

	async addReaction(reaction, remoteId) {

		reaction.uid = reaction.uid || discovery.id;

		if (remoteId) {
			try {
				await client.send(remoteId, 'reaction:add', reaction);
			}
			catch (e) {
				console.error('Failed to send reaction:', e);
			}
		}
		else {
			this.#db.addReaction(reaction);

			const notify = reaction.parent_uid != reaction.uid && reaction.parent_uid != discovery.id ? [reaction.parent_uid] : [];
			client.broadcast('home', 'reaction:added', reaction, notify, reaction.uid);
		}
	}

	onCommentAdd(comment) {
		this.addComment(comment);

		comment.isReply = comment.comment_id && comment.parent_uid == discovery.id;
		events.emit('comment:added', comment);
	}

	onCommentAdded(comment, remoteId) {
		comment.remote = remoteId;

		comment.isReply = comment.comment_id && comment.parent_uid == discovery.id;
		events.emit('comment:added', comment);
	}

	onReactionAdd(reaction) {
		this.addReaction(reaction);
		events.emit('reaction:added', reaction);
	}

	async queryTracks(params, remoteId) {
		const remote = discovery.getRemote(remoteId);

		if (!remote) return [];

		const query = new URLSearchParams(Object.clean(params));
		const url = remoteUrl(remote);

		console.debug('[REMOTE] get tracks:', params);

		try {
			const res = await fetch(`${url}/api/tracks?${query.toString()}`);
			const tracks = await res.json();

			return remoteTracks(tracks, url, remoteId);

		}
		catch (e) {
			console.error('🚨 Failed to fetch remote tracks:', e);
		}

		return [];
	}

	async queryCollections(collection, params, remoteId) {
		const remote = discovery.getRemote(remoteId);
		
		if (!remote) return [];

		const query = new URLSearchParams(Object.clean(params));
		const url = remoteUrl(remote);

		console.debug('[REMOTE] get collection:', collection, params);

		try {
			const res = await fetch(`${url}/api/collection/${collection}?${query.toString()}`);
			const sets = await res.json();

			return remoteSets(sets, url, remoteId);
		}
		catch (e) {
			console.error('🚨 Failed to fetch remote sets:', e);
		}

		return [];
	}

	async getAlbumTracks(id, remoteId) {
		const remote = discovery.getRemote(remoteId);
		if (!remote) return [];

		const url = remoteUrl(remote);

		try {
			const res = await fetch(`${url}/api/album/${id}/tracks`);
			const tracks = await res.json();

			return remoteTracks(tracks, url, remoteId);
		}
		catch (e) {
			console.error('🚨 Failed to fetch remote sets:', e);
		}

		return [];
	}

	async getPlaylistTracks(id, remoteId) {
		const remote = discovery.getRemote(remoteId);
		if (!remote) return [];

		const url = remoteUrl(remote);

		try {
			const res = await fetch(`${url}/api/playlist/${id}/tracks`);
			const tracks = await res.json();

			return remoteTracks(tracks, url, remoteId);
		}
		catch (e) {
			console.error('🚨 Failed to fetch remote sets:', e);
		}

		return [];
	}

	getUrl(remoteId) {
		const remote = discovery.getRemote(remoteId);
		return remote ? remoteUrl(remote) : null;
	}

	registerHandlers(ipc) {
		ipc.handle('process-link', async (event, url) => processLink(url));
		ipc.handle('query-posts', (event, query, remoteId) => this.queryPosts(query, remoteId));
		ipc.handle('add-post', (event, post) => this.addPost(post));
		ipc.handle('delete-post', (event, id) => this.deletePost(id));
		ipc.handle('get-comments', async (event, postId, commentId, remoteId) => this.getComments(postId, commentId, remoteId));
		ipc.handle('add-comment', (event, comment, remoteId) => this.addComment(comment, remoteId));
		ipc.handle('add-reaction', (event, reaction, remote) => this.addReaction(reaction, remote));

		ipc.handle('connect-remote', async (event, remoteId) => this.connect(remoteId));
		ipc.handle('disconnect-remote', (event, remoteId) => this.disconnect(remoteId));

		ipc.handle('query-remote-tracks', async (event, query, remoteId) => this.queryTracks(query, remoteId));
		ipc.handle('query-remote-collections', async (event, collection, query, remoteId) => this.queryCollections(collection, query, remoteId));

		ipc.handle('get-remote-album-tracks', async (event, albumId, remoteId) => this.getAlbumTracks(albumId, remoteId));
		ipc.handle('get-remote-playlist-tracks', async (event, id, remoteId) => this.getPlaylistTracks(id, remoteId));

	}
}

function remoteUrl(remote) {
	return `http://${remote.address}:${remote.port}`;
}

function remoteCoverPath(url, cover) {
	return cover
		.split(',')
		.map(i => url + i)
		.join(',');
}

function remoteTracks(tracks, url, remoteId) {
	for (const i of tracks) {
		i.remote = remoteId;
		i.path = url + i.path;

		if (i.thumb_path)
			i.thumb_path = url + i.thumb_path;
	}

	return tracks;
}

function remoteSets(sets, url, remoteId) {
	for (const i of sets) {
		i.remote = remoteId;

		if (i.cover_path)
			i.cover_path = remoteCoverPath(url, i.cover_path);
	}

	return sets;
}

export default RemoteService.instance;