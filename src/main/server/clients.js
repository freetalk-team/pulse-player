
export const clients = new Set;

export function broadcast(channel, type, payload) {

	console.debug('[BROADCAST]', channel, type, `clients=${clients.size}`);

	for (const socket of clients) {

		socket.send(JSON.stringify({ type, payload }));

		// if (socket.subscriptions?.has(channel)) {

		// 	socket.send(
		// 		JSON.stringify({ type, payload })
		// 	);
		// }
	}
}