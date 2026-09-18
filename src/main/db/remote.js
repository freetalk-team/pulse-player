
import { DatabaseBase } from './base';

import createPostsSQL from './sql/schema/008_create_posts.sql?raw';

export class RemoteDatabase extends DatabaseBase {
	
	init(storage) {

		super.init('remote', storage);
	}

	onCreate() {
		this.exec(createPostsSQL);
	}

	queryPosts(params) {
		params.order = ['created_at', 'DESC'];
		if (params.created_at)
			params.where = { created_at: params.created_at };

		return super.query('posts', params);
	}

	queryUserPosts(params, uid) {

		const args = [uid];
		let where = '', offset = '';

		if (params.created_at) {
			where = 'WHERE p.created_at > ?';
			args.push(params.created_at);
		}

		if ('offset' in params) {
			offset = 'LIMIT ? OFFSET ?';
			args.push(params.limit ?? 50, params.offset);
		}

		const sql = `
			SELECT
				p.*,
				COUNT(CASE WHEN r.reaction = 'like' THEN 1 END) AS reaction_count,
				MAX(CASE WHEN r.uid = ? THEN r.reaction END) AS reaction
			FROM posts p
			LEFT JOIN reactions r ON r.post_id = p.id
			${where}
			GROUP BY p.id
			ORDER BY p.created_at DESC
			${offset}
		`;

		console.debug('[DB] user posts:', sql, args);

		try {
			return this.prepare(sql).all(...args);
		}
		catch (e) {
			console.error('🚨 Failed to query posts:', e);
		}
	}

	ls(offset, limit) {
		return super.tail('posts', offset, limit);
	}

	add(post) {
		return super.insert('posts', {
			uid: post.uid,
			type: post.type,
			item: post.item || null,
			content: post.content || null
		}, ['id', 'created_at']);
	}

	delete(id) {
		super.delete('posts', id);
	}

	getComments(postId, commentId) {

		const where = commentId 
			? { comment_id: commentId } 
			: { post_id: postId, comment_id: null };

		return super.query('user_comments', {
			limit: 200,
			where,
			order: 'created_at'
		});
	}

	getUserComments(postId, commentId, uid) {

		const sql = `
			SELECT
				c.*,
				COUNT(CASE WHEN r.reaction = 'like' THEN 1 END) AS reaction_count,
				MAX(CASE WHEN r.uid = ? THEN r.reaction END) AS reaction
			FROM user_comments c
			LEFT JOIN reactions r ON r.comment_id = c.id
			WHERE ${commentId ? 'c.comment_id = ?' : 'c.post_id = ? AND c.comment_id IS NULL'}
			GROUP BY c.id
			ORDER BY c.created_at;
		`;

		try {
			return this.prepare(sql).all(uid, commentId || postId);
		}
		catch (e) {
			console.error('🚨 Failed to query comments:', e);
		}
	}

	addComment(comment) {

		console.debug('[DB] adding comment:', comment);

		return super.insert('comments', {
			content: comment.content || null,
			post_id: comment.post_id,
			comment_id: comment.comment_id || null,
			uid: comment.uid
		}, ['id', 'created_at']);
	}

	addReaction(reaction) {

		super.insert('reactions', {
			uid: reaction.uid,
			post_id: reaction.comment_id ? null : reaction.post_id,
			comment_id: reaction.reply_id || reaction.comment_id || null,
			reaction: 'like'
		});
	}

	updateUser(id, name, photo) {

		const sql = `
			INSERT INTO users (id, name, photo)
			VALUES (?, ?, ?)
			ON CONFLICT(id) 
			DO UPDATE SET
				name = COALESCE(NULLIF(excluded.name, ''), users.name),
				photo = COALESCE(NULLIF(excluded.photo, ''), users.photo)
		`;

		try {
			return this.db
				.prepare(sql)
				.run(id, name, photo || null);
		}
		catch (e) {
			console.error('🚨 Failed to update user:', e);
		}
	}

}

