import { writable, get } from "svelte/store";

import { sleep } from "../utils/sleep";

export const isLoading = writable(false);

const LIMIT = 10;
const LOADING_TIMEOUT = 600;

let fetching = false;

export class Posts {
	#store = writable({ posts: [], hasMore: true });
	#offset = 0;

	get store() { return this.#store; }
	get offset() { return this.#offset; }
	set offset(o) { this.#offset = o; }

	isMe(uid) {
		return uid == api.getPref('uid');
	}

	fetchPosts(query) { return api.getPosts(query); }
	fetchComments(postId) { return api.getComments(postId, null); }
	fetchReplies(commentId) { return api.getComments(null, commentId); }
	sendReaction(reaction) { return api.addReaction(reaction); }

	async loadPosts() {

		console.debug('Load posts:');

		const offset = this.#offset;

		const [items] = await Promise.all([
			this.fetchPosts({ offset: this.#offset, limit: LIMIT }),
			sleep(LOADING_TIMEOUT)
		]);

		console.debug('Fetched posts:', items.length);

		this.updatePosts(items, true);
	}

	async addPost(content, type='post', item) {
		const post = await api.addPost(type, item, content);

		post.type = type;
		post.content = content;
		post.item = item;

		this.appendPost(post);
	}

	appendPost(post) {

		console.debug('Appending post:', post);

		post.comments = [];
		post.commentsLoaded = false;
		post.comments_count = 0;
		post.reaction_count = 0;

		this.#offset++;
		this.#store.update(current => {
			return {
				...current,
				posts: [post, ...current.posts]
			}
		});
	}

	async deletePost(post) {
		const postId = typeof post == 'number' ? post : post.id;

		await api.deletePost(postId);

		this.#offset--;
		this.#store.update(state => {
			const post = state.posts.find(p => p.id === postId);
			if (!post) return state;

			return { ...state, posts: state.posts.filter(i => i.id != postId) };
		});
	}

	async loadComments(postId) {
		const fetchedComments = await this.#loadComments(postId); 
		
		// Map comments to include lazy loading states for replies
		const commentsWithStates = fetchedComments.map(c => ({
			...c,
			repliesLoaded: false, // Do not load replies yet
			replies: []
		}));

		this.#store.update(state => {
			const post = state.posts.find(p => p.id === postId);
			if (post) {
				post.comments = commentsWithStates;
				post.commentsLoaded = true;
			}
			return { ...state };
		});
	}

	async loadReplies(postId, commentId) {
		// Fetch replies from your local SQLite or remote P2P instance
		const fetchedReplies = await this.fetchReplies(commentId);

		this.#store.update(state => {
			const post = state.posts.find(p => p.id === postId);
			if (!post) return state;

			const comment = post.comments.find(c => c.id === commentId);
			if (comment) {
				comment.replies = fetchedReplies;
				comment.repliesLoaded = true;
			}
			return { ...state };
		});
	}

	async addComment(comment) {
		const res = await api.addComment(comment);
		
		Object.assign(comment, res);
		this.appendComment(comment);
	}

	// Handles P2P live events and instant UI updates for local user additions
	appendComment(newComment) {
		newComment.replies_count = 0;
		newComment.reaction_count = 0;

		this.#store.update(state => {
			const post = state.posts.find(p => p.id === newComment.post_id);
			if (!post) return state;

			if (!newComment.comment_id) {
				// Top-level comment: append only if UI section is already visible
				if (post.commentsLoaded) {
					post.comments = [...post.comments, { ...newComment, repliesLoaded: true, replies: [] }];
				}

				post.comments_count++;
			} else {
				// Nested reply
				const comment = post.comments.find(c => c.id === newComment.comment_id);
				if (comment) {
					// Append reply if user already clicked "Show Replies", or if they just typed it
					if (comment.repliesLoaded) {
						comment.replies = [...comment.replies, newComment];
					}
					else if (comment.replies_count == 0) {
						comment.replies = [newComment];
						comment.repliesLoaded = true;
					}

					comment.replies_count++;
				}
			}

			return { ...state };
		});
	}

	async addReaction(post, comment) {

		const reaction = comment
			? comment.comment_id
				? {
					post_id: comment.post_id,
					comment_id: comment.comment_id,
					reply_id: comment.id,
					parent_uid: comment.uid
				}
				: {
					post_id: comment.post_id,
					comment_id: comment.id,
					parent_uid: comment.uid
				}
			: {
				post_id: post.id,
				parent_uid: post.uid
			};

		await this.sendReaction(reaction);

		this.appendReaction(reaction);
	}

	appendReaction(reaction, own=true) {
		this.#store.update(state => {
			const post = state.posts.find(p => p.id === reaction.post_id);
			if (!post) return state;

			if (reaction.comment_id) {
				const comment = post.comments.find(c => c.id === reaction.comment_id);
				if (comment) {

					if (reaction.reply_id) {
						const reply = comment.replies.find(r => r.id === reaction.reply_id);
						if (reply) {
							reply.reaction_count++;
							if (own) reply.reaction = 'like';

							return { ...state };
						}
					}
					else {
						comment.reaction_count++;
						if (own) comment.reaction = 'like';

						return { ...state };
					}
				}
			}
			else {
				post.reaction_count++;
				if (own) post.reaction = 'like';

				return { ...state };
			}

			return state;
		});
	}

	async #loadComments(postId) {

		const comments = await this.fetchComments(postId);

		for (const c of comments) {
			c.replies = [];
			c.repliesLoaded = false;
		}

		return comments;
	}

	updatePosts(items, append=true) {
		for (const i of items) {
			if (typeof i.item === 'string') {
				i.item = JSON.parse(i.item);
			}
			// Fix typo: attach fields to the post object 'i', not the array 'items'
			i.comments = [];
			i.commentsLoaded = false;
		}

		this.#offset += items.length; 

		// 2. Trigger Svelte reactivity using array spreading
		this.#store.update(current => {
			return {
				...current, // Copy existing store fields (like hasMore, etc.)
				posts: append ? [...current.posts, ...items] : [...items, ...current.posts], 
				hasMore: items.length === LIMIT // Assumes hasMore is true if we hit the limit ceiling
			};
		});
	}
}

export const controller = new Posts();

api.on('comment:added', comment => {
	if (comment.remote) return;

    console.debug('Comment added:', comment);
    controller.appendComment(comment);
});

api.on('reaction:added', reaction => {
	if (reaction.remote) return;

    console.debug('Reaction added:', reaction);
    controller.appendReaction(reaction);
});

export async function fetch() {

	if (fetching) return;
	
	fetching = true;

	try {
		isLoading.set(true);

		await controller.loadPosts();
	}
	catch (e) {
		console.error('Failed to fetch remote posts:', e);
	}
	finally {
		fetching = false;
		isLoading.set(false);
	}
}

export function canReply(comment) {
	const uid = api.getPref('uid');
	return comment.uid != uid && !comment.replies.some(i => i.uid == uid);
}