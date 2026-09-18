import { writable, get } from "svelte/store";

import { controller } from "./posts";

export const share = writable(null);

export async function createPost(description) {

	const { type, item } = get(share) || { type: 'post' };

	//await api.addPost(type, item, description);

	console.debug('Creating post:', type, item);

	await controller.addPost(description, type, item);

	share.set(null);
}



