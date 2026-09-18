
import fs from 'node:fs';
import { parse } from 'node:path';
import ytdl from "ytdl-core";

import Http from './http';

process.env.YTDL_NO_UPDATE = '1';

export default class Youtube {

	static getId(filename) {
		const { name, ext } = parse(filename);
		const m = name.match(/\[([a-zA-Z0-9_-]{11})\]$/) // youtube id
		return m?.[1];
	}

	static async getMeta(id) {

		let meta;

		try {

			const info = await ytdl.getBasicInfo(id, {
					requestOptions: {
						headers: {
							'user-agent': Http.UserAgent
						},
					},
				}
			);

			const details = info.videoDetails;
			const thumbnails = details.thumbnails.reverse();

			meta = {
				title: details.title,
				artist: details.author.name
			};

			let thumb = thumbnails[0];

			for (thumb of thumbnails) {
				if (thumb.width < 400)
					break;
			}

			if (thumb) {

				// const filename = await Image.downloadThumb(thumb.url, store.thumbDir);

				meta.cover = thumb.url;
			}

			console.debug('[YOUTUBE] track meta:', meta);
		}

		catch (e) {
			console.error('[YOUTUBE] Error:', e.message);
		}

		return meta;
	}
	
}