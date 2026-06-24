import { writable, get } from "svelte/store";

export const share = writable(null);

export async function createPost(description) {

	const { type, item } = get(share) || { type: 'post' };

	await api.addPost(type, item, description);

	share.set(null);
}



