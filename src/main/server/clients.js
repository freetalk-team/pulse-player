
export const clients = new Set;

export function broadcast(channel, type, payload) {

	for (const socket of clients) {

		if (socket.subscriptions?.has(channel)) {

			socket.send(
				JSON.stringify({ type, payload })
			);
		}
	}
}