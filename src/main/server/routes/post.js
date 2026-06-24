
import db from '../../db'

import { normalizeCoverPaths, normalizePaths } from './common'

export default async function routes(app) {

	app.get('/', async (req, reply) => {

		let { offset, limit } = req.query;

		limit = limit ? parseInt(limit) : 10;
		offset = offset ? parseInt(offset) : 0;

		const posts = db.getPosts(offset, limit);

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

	app.get('/:id/comments', async (req, reply) => {
		let { id } = req.params;

		id = parseInt(id);

		const comments = db.getComments(id);

		return comments;
	});

	// app.post('/', async (req, reply) => {
	// 	const post = await createPost(req.body);

	// 	await app.events.onPostCreated(post);

	// 	return post;
	// });
	
}