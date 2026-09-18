
import { writable } from "svelte/store";

export const isImporting = writable(false);
export const importProgress = writable(0);

api.on('import-start', () => {
	importProgress.set(0);
	isImporting.set(true);
});

api.on('import-end', () => {
	isImporting.set(false);
});

api.on('import-progress', (progress) => {
	const { processed, total } = progress;
	const prog = Math.floor((processed / total) * 100);

	importProgress.set(prog);
});

export function scanFolders(paths) {
	importProgress.set(0);
	isImporting.set(true);
	api.scanFolders(paths);
}