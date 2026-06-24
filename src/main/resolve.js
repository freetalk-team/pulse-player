import { app } from 'electron';

import { join } from 'node:path';
import os from 'node:os';
import fs from 'fs';

const HOME_DIR = os.homedir();

const resolver = {
	user: {},

	normalize(path) {

		for (const [key, dir] of Object.entries(this.user)) {
			if (path.startsWith(dir))
				return join(`[${key}]`, path.slice(dir.length));
		}

		if (path.startsWith(HOME_DIR))
			return join('~', path.slice(HOME_DIR.length));

		return path;

	},

	resolve(path) {
		return path.startsWith('~')
			? path.replace('~', HOME_DIR)
			: path.replace(/^\[(.*)\]/, (_, key) => this.user[key]);
	},

	load(dirs) {
		if (dirs) {
			Object.assign(this.user, dirs);
		}
		else {
			const userData = app.getPath('userData');

			const THUMB_DIR = join(userData, 'thumbnails');

			if (!fs.existsSync(THUMB_DIR)) 
				fs.mkdirSync(THUMB_DIR);

			this.user = {
				thumb: THUMB_DIR,
				music: join(HOME_DIR, 'Music'),
				video: join(HOME_DIR, 'Video')
			}
		}
	}
}

export default resolver;