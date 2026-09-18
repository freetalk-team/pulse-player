
import remote from '../../services/remote';

import { normalizeCoverPaths, normalizePaths } from './common'

export default async function routes(app) {

	app.get('/', async (req, reply) => {

		const { limit, offset, created_at } = req.query;
		const query = {};

		if (created_at) {
			query.created_at = created_at;
		}
		else {
			query.limit = limit ? parseInt(limit) : 10;
			query.offset = offset ? parseInt(offset) : 0;
		}

		const uid = parseInt(req.query.uid) || null;

		console.debug('[SERVER] query posts:', query);

		const posts = await remote.queryPosts(query, null, uid);

		for (const i of posts) {

			if (i.type == 'post')
				continue;

			i.item = JSON.parse(i.item);

			switch (i.type) {

				case 'track':
				normalizePaths(i.item);
				break;

				default:
				normalizeCoverPaths(i.item);
				break;
			}
		}

		return posts;
	});

	app.get('/comments/:id', async (req, reply) => {
		let { id } = req.params;
		let { uid } = req.query;

		id = parseInt(id);
		uid = parseInt(uid) || null;

		const comments = await remote.getComments(id, null, null, uid);

		return comments;
	});

	app.get('/replies/:id', async (req, reply) => {
		let { id } = req.params;
		let { uid } = req.query;

		id = parseInt(id);
		uid = parseInt(uid) || null;

		const comments = await remote.getComments(null, id, null, uid);

		return comments;
	});

	// app.post('/', async (req, reply) => {
	// 	const post = await createPost(req.body);

	// 	await app.events.onPostCreated(post);

	// 	return post;
	// });
	
}