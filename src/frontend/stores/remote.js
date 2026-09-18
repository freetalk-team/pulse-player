
import { writable, get } from "svelte/store";

import { sleep } from "../utils/sleep";

import { recent, queue, currentTrack, playNext } from "./play";

export const remotes = writable([]);
export const currentRemote = writable(null);
export const unread = writable(0);

let loaded = false;

api.on('add-remote-player', player => {
	console.debug('Remote player found', player);

	remotes.update(list => {
		// const players = list.filter(i => i.id != player.id);
		// players.unshift(player);

		if (list.find(i => i.id == player.id))
			return list;

		return [player, ...list];
	});
});

api.on('remove-remote-player', player => {
	console.debug('Remote player removed', player);
	remotes.update(list => list.filter(i => i.id !== player.id));

	if (get(currentRemote)?.id == player.id)
		currentRemote.set(null);

	recent.update(list => list.filter(i => i.remote != player.id));
	queue.update(list => list.filter(i => i.remote != player.id));

	const current = get(currentTrack);

	if (current?.remote == player.id)
		playNext();
});

api.on('comment:added', comment => {
	if (!loaded) return;

	const current = get(currentRemote);
	if (comment.isReply && comment.uid != current?.id) {
		remotes.update(v => {
			const index = v.findIndex(i => i.id == comment.uid);
			if (index != -1) {
				const r = v[index];
				v.splice(index, 1, { ...r, unread: r.unread + 1 }); 
			}

			return v;
		});
	}

	if (!comment.remote && current) {
		unread.update(n => n + 1);
	}
});

currentRemote.subscribe(remote => {
	if (remote) {

		remotes.update(v => {
			const index = v.findIndex(i => i.id == remote.id);
			if (index != -1) {
				const r = v[index];
				if (r.unread > 0)
					v.splice(index, 1, { ...r, unread: 0 }); 
			}

			return v;

		});
	}
	else {
		unread.set(0);
	}
});

export function connectRemote(remoteId) {
	api.connectRemote(remoteId);
}

export function disconnectRemote(remoteId) {
	api.disconnectRemote(remoteId);

}

export async function loadRemotePlayers() {
	if (loaded) return;

	const players = await api.loadRemotePlayers();

	for (const i of players)
		i.unread = 0;

	remotes.set(players);

	loaded = true;
}

export function selectRemote(remote) {

	console.debug('Select remote:', remote);

	currentRemote.set(remote);
}

