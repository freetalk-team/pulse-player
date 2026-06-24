import { EventEmitter } from 'node:events';

import db from './db';
import { broadcast } from './server/clients';

export const events = new EventEmitter();

export function setupEventHandlers(handler) {

	events.on('comment:add', comment => {

		console.debug('[EVENT] comment add:', comment);

		const { content, post_id, user_id, parent_comment_id } = comment;

		const res = db.addComment(content, post_id, parent_comment_id, user_id);

		Object.assign(comment, res);

		handler('comment:added', comment);
		broadcast('home', 'comment:added', comment);
	});

	events.on('comment:added', comment => handler('comment:added', comment));
	events.on('post:create', post => handler('post:create', post));
}