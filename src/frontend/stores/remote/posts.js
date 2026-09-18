import { writable, get } from "svelte/store";

import { sleep } from "../../utils/sleep";
import { currentRemote, connectRemote, disconnectRemote } from "../remote";
import { Posts } from "../posts";

const LOADING_TIMEOUT = 600;
const DESTROY_REMOTE_TIMEOUT = 300 * 1000;

class RemotePosts extends Posts {
	#remote = null;
	#loaded = false;
	#lastUpdate;
	#disconnected = true;
	#lastRequestId = 0;
	#cache = new Map;

	get remoteId() { return this.#remote; }
	get canUpdate() { return this.#loaded; }

	fetchPosts(query) { return api.getPosts(query, this.#remote); }
	fetchComments(postId) { return api.getComments(postId, null, this.#remote); }
	fetchReplies(commentId) { return api.getComments(null, commentId, this.#remote); }
	sendReaction(reaction) { return api.addReaction(reaction, this.#remote); }

	reset(remote) {
		console.debug('Post controller reset:', remote);

		this.offset = 0;
		this.#remote = remote;
		this.#loaded = false;
		this.#lastUpdate = null;
		this.#disconnected = true;

		this.store.set({ posts: [], hasMore: true });
	}

	connect(remoteId) {
		console.debug('CONNECT remote:', remoteId);

		if (remoteId != this.#remote) {

			if (this.#remote) {

				const current = this.#remote;

				disconnectRemote(current);

				const state = get(controller.store);
				const destroyTimeout = setTimeout(() => {
					console.debug('Destroying remote:', current);
					this.#cache.delete(current);		
				}, DESTROY_REMOTE_TIMEOUT);

				this.#cache.set(current, { state, destroyTimeout, disconnected: this.#disconnected });
			}

			const remote = this.#cache.get(remoteId);
			if (remote) {
				console.debug('Clear destroy timeout:', remoteId);
				clearTimeout(remote.destroyTimeout);
				this.#setRemote(remoteId, remote.state, remote.disconnected);

				this.#cache.delete(remoteId);
			}
			else {
				this.offset = 0;
				this.store.set({ posts: [], hasMore: true });

				this.#loaded = false;
				this.#lastUpdate = null;
				this.#disconnected = true;
			}
		}

		const isConnected = !this.#disconnected;

		this.#remote = remoteId;
		this.#disconnected = false;

		connectRemote(remoteId);

		return isConnected;
	}

	disconnect(remoteId) {
		if (!remoteId) {
			disconnectRemote(this.#remote);
			return;
		}

		if (remoteId == this.#remote) {
			this.#disconnected = true;
		}
		else {
			const remote = this.#cache.get(remoteId);
			if (remote)
				remote.disconnected = true;
		}
	}

	async loadPosts(update) {
		// if (!this.#disconnected) return;

		console.debug('Remote posts load:', update, this.#lastUpdate);

		const requestId = ++this.#lastRequestId;

		if (update && this.#lastUpdate) {
			const [items] = await Promise.all([
				api.getPosts({ created_at: this.#lastUpdate }, this.#remote),
				sleep(LOADING_TIMEOUT)
			]);

			if (requestId !== this.#lastRequestId) 
				return;

			console.debug('Fetched new posts:', items.length);

			this.updatePosts(items, false);

			return;
		}

		await super.loadPosts();
	}

	appendPost(post) {
		if (post.remote != this.#remote) {
			this.#appendPost(post);
			return;
		}

		super.appendPost(post);

		this.#lastUpdate = post.created_at;
	}

	updatePosts(items, append) {
		super.updatePosts(items, append);

		this.#lastUpdate = items[0]?.created_at || this.#lastUpdate;
	}

	async addComment(comment) {
		await api.addComment(comment, this.#remote);
	}

	// Handles P2P live events and instant UI updates for local user additions
	appendComment(newComment) {

		if (newComment.remote != this.#remote) {
			this.#appendComment(newComment);
			return;
		}

		super.appendComment(newComment);
	}

	appendReaction(reaction, own=true) {
		if (reaction.remote && reaction.remote != this.#remote) {
			this.#appendReaction(reaction);
			return;
		}

		super.appendReaction(reaction, own);
	}

	#appendPost(post) {
		const remote = this.#cache.get(post.remote);
		if (remote) {
			post.comments_count = 0;
			post.commentsLoaded = false;
			post.comments = [];

			remote.state.posts.unshift(post);
		}
	}

	#appendComment(comment) {
		const remote = this.#cache.get(comment.remote);
		if (!remote) return;

		const post = remote.state.posts.find(p => p.id === comment.post_id);
		if (!post) return;

		comment.replies = [];
		comment.repliesLoaded = false;

		if (!comment.comment_id) {
			// Top-level comment: append only if UI section is already visible
			if (post.commentsLoaded) {
				post.comments.push(comment);
			}

			post.comments_count++;
		} else {
			// Nested reply
			const parent = post.comments.find(c => c.id === comment.comment_id);
			if (parent) {
				// Append reply if user already clicked "Show Replies", or if they just typed it
				if (parent.repliesLoaded) {
					parent.replies.push(comment);
				}

				parent.replies_count++;
			}
		}
	}

	#appendReaction(reaction) {
		const remote = this.#cache.get(reaction.remote);
		if (!remote) return;

		const post = remote.state.posts.find(p => p.id === reaction.post_id);
		if (!post) return;

		if (reaction.comment_id) {
			const comment = post.comments.find(c => c.id === reaction.comment_id);
			if (!comment) return;

			if (reaction.reply_id) {
				const reply = comment.replies.find(r => r.id === reaction.reply_id);
				if (reply) {
					reply.reaction_count++;
				}
			}
			else {
				comment.reaction_count++;
			}
		}
		else {
			post.reaction_count++;
		}
	}

	#setRemote(id, state, disconnected) {

		this.offset = state.posts.length;

		this.#remote = id;
		this.#loaded = true;
		this.#lastUpdate = state.posts[0]?.created_at;

		if (disconnected)
			this.#disconnected = disconnected;

		console.debug('Post controller setting remote:', id, state, this.#lastUpdate);

		this.store.set(state);
	}
}

export const controller = new RemotePosts;
export const isLoading = writable(false);

let fetching = false;

api.on('post:create', post => {
	console.debug('Post added:', post);
	controller.appendPost(post);
});

api.on('comment:added', comment => {
    if (!comment.remote) return;

    console.debug('Comment remote:', comment);
	controller.appendComment(comment);
});

api.on('reaction:added', reaction => {
    if (!reaction.remote) return;

    console.debug('Reaction remote:', reaction);
    controller.appendReaction(reaction, false);
});

api.on('remote:closed', remoteId => {
	console.debug('Remote connection closed:', remoteId);
	controller.disconnect(remoteId);
});

export function setRemote(remote) {
	console.debug('Remote change:', remote);

	if (remote) {
		if (!controller.connect(remote.id))
			fetch(true);
	}
	else {
		controller.disconnect();
	}
}

export async function fetch(update) {

	if (fetching) return;
	
	fetching = true;

	try {

		isLoading.set(true);

		await controller.loadPosts(update);
	}
	catch (e) {
		console.error('Failed to fetch remote posts:', e);
	}
	finally {
        fetching = false;
		isLoading.set(false);
	}
}