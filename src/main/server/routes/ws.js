
import { clients } from "../clients";
import { events } from "../../events";

export default async function routes(app) {

	app.get('/', { websocket: true }, socket => {

		clients.add(socket);

		socket.subscriptions = new Set();

		socket.on('message', raw => {

			let message;

			try {

				message = JSON.parse(raw.toString());
			}
			catch {

				socket.close();

				return;
			}

			console.debug('[WS] server message:', message);

			switch (message.type) {

				case 'hello':

					socket.send(JSON.stringify({
						type: 'hello',
						name: 'Living Room Player'
					}));

				break;

				case 'subscribe':
				console.debug('SUBSCRIBE:', message.channel);
				socket.subscriptions.add(message.channel);
				break;

				case 'unsubscribe':
				console.debug('UNSUBSCRIBE:', message.channel);
				socket.subscriptions.delete(message.channel);
				break;

				case 'comment:add':
				events.emit('comment:add', message.payload);
				break;

				case 'pong':
				break;
			}
		});

		const ping = setInterval(() => {

			if (socket.readyState === 1) {

				socket.send(JSON.stringify({
					type: 'ping'
				}));
			}

		}, 15000);

		socket.on('close', () => {
			clearInterval(ping);
			clients.delete(socket);
		});
	});

}