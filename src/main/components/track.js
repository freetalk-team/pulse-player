
import { ComponentsBase } from './base';
import { Image } from '../utils/image';

export class TrackComponents extends ComponentsBase {

	constructor(dbRoot) {
		super (dbRoot, 'track');
	}

	async fetchMeta(track, thumbDir) {

		const param = {
			title: track.title,
			artist: track.artist
		};

		const album = {
			meta: {},

			setName(name) {
				if (!name) return;
				this.meta.name = name;
			},

			setThumbnail(thumb) {
				if (!thumb) return;
				this.thumb = thumb;
			},

			setGenre(genre) {
				if (!genre) return;
				this.meta.genre = genre;
			},

			setYear(year) {
				if (!year) return;

				if (typeof year == 'string')
					year = parseInt(year);

				this.meta.year = year;
			},

			setDescription() {

			}
		};


		const res = await this.run({ track: param, album });

		if (res) {

			const meta = album.meta;

			if (album.thumb) {
				meta.cover = await Image.downloadThumb(album.thumb, thumbDir);
			}

			return meta;
		}
	}
	
}
