
import { ComponentsBase } from './base';
import { Image } from '../utils/image';

export class AlbumComponents extends ComponentsBase {

	constructor(dbRoot) {
		super (dbRoot, 'album');
	}

	async fetchMeta(album, thumbDir) {

		const param = {
			name: album.name,
			artist: album.artist,
			genre: album.genre,
			year: album.year,

			setThumbnail(thumb) {
				if (!thumb) return;

				this.thumb = thumb;
			},

			setYear(year) {
				if (!year) return;

				if (typeof year == 'string')
					year = parseInt(year);

				this.year = year;
			},

			setGenre(genre) {
				if (!genre) return;

				this.genre = genre;
			},

			setDescription() {

			}
		};

		const res = await this.run({ album: param });

		if (res) {

			if (param.thumb) 
				album.cover = await Image.downloadThumb(param.thumb, thumbDir);
			
			if (param.genre)
				album.genre = param.genre;

			if (param.year)
				album.year = param.year;
		}

		return album;
	}

	
}
