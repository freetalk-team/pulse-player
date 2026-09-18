import { EventEmitter } from 'node:events';

import remote from './services/remote';

export const events = new EventEmitter();

export function setupEventHandlers(handler) {
	events.on('comment:added',  comment  => handler('comment:added', comment));
	events.on('reaction:added', reaction => handler('reaction:added', reaction));
	events.on('post:create',    post     => handler('post:create', post));
	events.on('remote:closed',  remoteId => handler('remote:closed', remoteId));

	events.on('recording:started', station => handler('recording:started', station));
	events.on('recording:ended',   station => handler('recording:ended', station));

	events.on('track:added',    track    => handler('track:added', track));
	events.on('playlist:added', playlist => handler('playlist:added', playlist));

	events.on('error', msg => handler('error', msg));
}