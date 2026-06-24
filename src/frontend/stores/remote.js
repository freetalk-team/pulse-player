
import { writable, get } from "svelte/store";

import { sleep } from "../utils/sleep";

import { recent, queue, currentTrack, playNext } from "./play";

export const remotes = writable([]);
export const currentRemote = writable(null);
export const isLoading = writable(false);

export const posts = writable([]);
export const comments = writable({});
export const replies = writable({});

export const hasMore = writable(true);

const LIMIT = 10;

let loaded = false;

api.on('add-remote-player', player => {
	console.debug('Remote player found', player);

	remotes.update(list => {
		// const players = list.filter(i => i.id != player.id);
		// players.unshift(player);

		if (list.find(i => i.id == player.id))
			return list;

		return [player, ...list];
	});
});

api.on('remove-remote-player', player => {
	console.debug('Remote player removed', player);
	remotes.update(list => list.filter(i => i.id !== player.id));

	if (get(currentRemote)?.id == player.id)
		currentRemote.set(null);

	recent.update(list => list.filter(i => i.remote != player.id));
	queue.update(list => list.filter(i => i.remote != player.id));

	const current = get(currentTrack);

	if (current?.remote == player.id)
		playNext();
});

api.on('post:create', post => {
	console.debug('Post added:', post);

	posts.update(list => [post, ...list]);
});

api.on('comment:added', comment => {
	console.debug('Comment added:', comment);

	if (comment.parent_comment_id) {
		replies.update(all => {

			const parent = all[comment.parent_comment_id];
			if (parent) {
				parent.push(comment);

				return { ...all, [comment.parent_comment_id]: parent };
			}

			return all;
		});
	}
	else {
		comments.update(all => {
			const parent = all[comment.post_id];

			console.debug('Parent comments', all, comment.post_id);

			if (parent) {
				parent.push(comment);

				return { ...all, [comment.post_id]: parent };
			}

			return all;
		});

		updateCommentsCount(comment.post_id);
	}
});

export function connectRemote(remote) {
	api.connectRemote(remote.id);
}

export function disconnectRemote(remote) {
	api.disconnectRemote(remote.id);

}

export async function loadRemotePlayers() {
	if (loaded) return;

	const players = await api.loadRemotePlayers();

	remotes.set(players);

	loaded = true;
}

export async function loadPosts(offset, limit) {

	// console.trace('Loading posts ...');

	try {

		isLoading.set(true);

		const remote = get(currentRemote);
		const current = get(posts);

		const [items] = await Promise.all([
			api.getPosts(current.length, LIMIT, remote?.id),
			sleep(800)
		]);

		console.debug('Loaded posts:', items);

		hasMore.set(items.length == LIMIT);

		for (const i of items) {
			if (typeof i.item == 'string')
				i.item = JSON.parse(i.item);
		}

		posts.update(list => [...list, ...items]);
	}
	finally {
		isLoading.set(false);
	}
}

export async function addPost(content) {

	const post = await api.addPost('post', null, content);

	post.type = 'post';
	post.content = content;

	posts.update(list => [post, ...list]);
}

export function selectRemote(remote) {

	console.debug('Select remote:', remote);

	posts.set([]);
	comments.set({});
	replies.set({});
	hasMore.set(true);
	currentRemote.set(remote);

	loadPosts();
}

export async function loadComments(postId) {

	if (get(comments)[postId]) return;

	const remote = get(currentRemote);
	const rows = await api.getComments(postId, remote?.id);
	const coms = buildCommentTree(rows);

	comments.update(all => {

		console.debug('Comments:', all);

		const parent = all[postId];
		if (parent)
			return all;

		console.debug('Loaded comments:', postId, coms);

		const reps = {};

		for (const i of coms) 
			reps[i.id] = i.replies;

		replies.update(all => ({ ...all, ...reps }));

		return { ...all, [postId]: coms };

	});
}

export async function addComment(content, postId, parentId) {
	const remoteId = get(currentRemote)?.id;
	const res = await api.addComment(content, postId, parentId, remoteId);

	if (!remoteId) {

		const comment = Object.assign(res, {
			content,
			post_id: postId,
			parent_comment_id: parentId,
		});

		if (parentId) {
			replies.update(all => {
				const parent = all[parentId];
				parent.push(comment);

				return { ...all, [parentId]: parent };
			});
		}
		else {
			comments.update(all => {
				const parent = all[postId];
				parent.push(comment);

				return { ...all, [postId]: parent };
			});

			updateCommentsCount(postId);
		}
	}

	// if (res) {
	// 	res.username = api.getPref('username');
	// 	res.created_at = new Date(res.created_at);
	// }

	// return res;
}

function buildCommentTree(rows) {

	const comments = [];
	const map = new Map();

	for (const row of rows) {

		row.replies = [];

		map.set(row.id, row);

		if (row.parent_comment_id == null) {
			comments.push(row);
		}
	}

	for (const row of rows) {

		if (row.parent_comment_id != null) {

			const parent = map.get(row.parent_comment_id);

			if (parent) {
				parent.replies.push(row);
			}
		}
	}

	return comments;
}

function updateCommentsCount(postId) {
	posts.update(all => {

		const index = all.findIndex(i => i.id == postId);

		// console.debug('Updating posts:', index, all);

		if (index != -1) {

			const post = all[index];

			post.comments_count++;

			if (index == 0) 
				return [post, ...all.slice(1)];
			
			if (index == all.length - 1)
				return [...all.slice(0, index), post];
			
			return [...all.slice(0, index), post, ...all.slice(index + 1)];
		}

		return all;

	});
}