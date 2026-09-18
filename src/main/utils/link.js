import fs from 'node:fs';
import path from 'node:path';
// import axios from 'axios';
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';

import store from '../store';
import Http from './http';
import { Image } from './image';

// const CACHE_DIR = path.join(app.getPath('userData'), 'image-cache');
const CACHE_DIR = store.imageCacheDir;

export async function processLink(url) {
	try {
		// Validate URL
		const validUrl = new URL(url);
		if (!['http:', 'https:'].includes(validUrl.protocol)) {
			throw new Error('Invalid protocol');
		}

		// Fetch the webpage
		// const response = await axios.get(url, {
		//   headers: {
		//     'User-Agent': 'Mozilla/5.0 (compatible; YourApp/1.0)'
		//   },
		//   timeout: 10000,
		//   maxRedirects: 5
		// });

		// const html = response.data;

		const html = await Http.get(url, { timeout: 5000, redirect: true });
		const $ = cheerio.load(html);

		// Extract metadata
		const metadata = {
			url: url,
			title: getMetaContent($, 'og:title') || $('title').text() || '',
			description: getMetaContent($, 'og:description') || getMetaContent($, 'description') || '',
			image: getMetaContent($, 'og:image') || getMetaContent($, 'twitter:image') || '',
			siteName: getMetaContent($, 'og:site_name') || new URL(url).hostname,
			favicon: getFavicon($, url),
			type: getMetaContent($, 'og:type') || 'website'
		};

		console.debug('[LINK] site meta:', metadata);

		// Clean up relative URLs
		if (metadata.image) {
			if (!metadata.image.startsWith('http'))
				metadata.image = new URL(metadata.image, url).href;

			const filename = await Image.downloadThumb(metadata.image, CACHE_DIR);
			
			metadata.image = 'media://' + path.join(CACHE_DIR, filename);
		}

		return metadata;
	} catch (error) {
		console.error('Link processing failed:', error);
		return null;
	}
}

function getMetaContent($, property) {
	const meta = $(`meta[property="${property}"]`).attr('content') ||
							 $(`meta[name="${property}"]`).attr('content');
	return meta ? meta.trim() : null;
}

function getFavicon($, url) {
	const favicon = $('link[rel="icon"]').attr('href') ||
									$('link[rel="shortcut icon"]').attr('href') ||
									$('link[rel="apple-touch-icon"]').attr('href');
	
	if (favicon) {
		if (favicon.startsWith('http')) return favicon;
		return new URL(favicon, url).href;
	}
	
	return `${new URL(url).origin}/favicon.ico`;
}

// main/imageCache.js



function getCacheKey(url) {
	return crypto.createHash('md5').update(url).digest('hex');
}

export async function cacheImage(url) {
	const key = getCacheKey(url);
	const cachePath = path.join(CACHE_DIR, key);
	
	if (fs.existsSync(cachePath)) {
		return `file://${cachePath}`;
	}
	
	try {
		const response = await axios.get(url, { responseType: 'arraybuffer' });
		const ext = path.extname(url) || '.jpg';
		const filePath = path.join(CACHE_DIR, `${key}${ext}`);
		
		if (!fs.existsSync(CACHE_DIR)) {
			fs.mkdirSync(CACHE_DIR, { recursive: true });
		}
		
		fs.writeFileSync(filePath, response.data);
		return `file://${filePath}`;
	} catch (error) {
		console.error('Failed to cache image:', error);
		return url;
	}
}