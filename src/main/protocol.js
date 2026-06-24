import { protocol, net } from 'electron';
import { pathToFileURL } from 'url';
import fs from 'fs';
import { stat } from 'fs/promises';
import mime from 'mime-types';

import db from './db';

const CHUNK_SIZE = 2 * 1024 * 1024;

export function registerProtocols() {

	protocol.registerSchemesAsPrivileged([
		{
			scheme: 'media',
			privileges: {
				standard: true,
				secure: true,
				supportFetchAPI: true,
				stream: true,
				corsEnabled: true
			}
		}
	])
}

export function registerProtocolHandlers() {
	protocol.handle('media', handleRequest);
}


async function handleRequest(request) {

	let path = decodeURIComponent(
		request.url.replace('media://', '')
	)

	path = resolvePath(path);

	// console.log('Handle request:', path);

	try {

		const { size } = await stat(path)
		const range = request.headers.get('range')

		const mimeType = mime.lookup(path) || 'application/octet-stream'

		// No range request (initial load)
		if (!range) {

			return new Response(
				fs.createReadStream(path),
				{
					status: 200,
					headers: {
						"Content-Type": mimeType,
						"Content-Length": size,
						"Accept-Ranges": "bytes"
					}
				}
			)

		}

		// Parse range header
		const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
		const start = parseInt(startStr)
		const end = endStr ? parseInt(endStr) : size - 1

		const stream = fs.createReadStream(path, { start, end })

		return new Response(
			stream,
			{
				status: 206,
				headers: {
					"Content-Type": mimeType,
					"Content-Length": end - start + 1,
					"Content-Range": `bytes ${start}-${end}/${size}`,
					"Accept-Ranges": "bytes",
					"Cache-Control": "no-cache"
				}
			}
		)

	} catch (err) {

		console.error("Media protocol error:", err)

		db.deleteTrack(path);

		return new Response(null, { status: 404 })

	}
}

function resolvePath(path) {

	// path = resolver.resolve(path);

	if (process.platform === 'linux') {
		if (!path.startsWith('/'))
			path = '/' + path;
	}

	return path;
}
