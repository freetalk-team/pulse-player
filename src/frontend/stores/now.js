import { readable } from 'svelte/store';

export const now = readable(Date.now(), set => {

	const interval = setInterval(() => {
		console.debug('Updating time ...');
		set(Date.now());
	}, 120 * 1000);

	return () => clearInterval(interval);
});