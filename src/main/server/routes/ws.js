import discovery from '../../services/discovery';
import client from '../../services/client';
import remote from '../../services/remote';

export default async function routes(app) {

	app.get('/', { websocket: true }, socket => {

		// socket.subscriptions = new Set();

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

				// socket.send(JSON.stringify({
				// 	type: 'hello',
				// 	name: discovery.hostname,
				// 	username: discovery.username,
				// 	version: discovery.version
				// }));

				socket.remoteId = message.id;
				client.addClient(socket);

				break;

				// case 'subscribe':
				// console.debug('SUBSCRIBE:', message.channel);
				// socket.subscriptions.add(message.channel);
				// break;

				// case 'unsubscribe':
				// console.debug('UNSUBSCRIBE:', message.channel);
				// socket.subscriptions.delete(message.channel);
				// break;

				case 'comment:add':
				remote.onCommentAdd(message.payload);
				break;

				case 'comment:added':
				remote.onCommentAdded(message.payload, socket.remoteId);
				break;

				case 'reaction:add':
				remote.onReactionAdd(message.payload);
				break;

				// case 'pong':
				// break;
			}
		});

		// const ping = setInterval(() => {

		// 	if (socket.readyState === 1) {

		// 		socket.send(JSON.stringify({
		// 			type: 'ping'
		// 		}));
		// 	}

		// }, 15000);

		
	});

}