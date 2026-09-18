
import { DatabaseBase } from './base';

import createRadioSQL from './sql/schema/009_create_radio.sql?raw';

export class RadioDatabase extends DatabaseBase {

	static dbname = 'radio';
	static table = 'station';
	static view = 'stations';
	static cache = 'station_search_cache';

	init(storage) {
		super.init(RadioDatabase.dbname, storage);

		this.cleanRecordings();
	}

	onCreate() {
		// console.debug('[DB] radio, creating database');
		// console.debug(createRadioSQL);

		this.exec(createRadioSQL);
	}

	get(id, columns) {
		return super.get(RadioDatabase.table, id, columns);
	}

	find(id) {
		return super.get(RadioDatabase.table, id);
	}

	query(params) {

		switch (params.sort) {
			case 'rating':
			params.order = ['rating', 'DESC'];
			break;

			case 'favourite':
			params.order = [ ['favourite', 'DESC'], ['rating', 'DESC'] ];
			break;

			case 'recent':
			params.order = ['played_at', 'DESC'];
			break;
		}

		if (params.favourite)
			params.where = { favourite: 1 };

		return super.query(RadioDatabase.view, params);
	}

	update(id, data) {
		return super.update(RadioDatabase.table, id, data);
	}

	add(stations) {

		const table = this.table(RadioDatabase.table);
		const sql = `
			INSERT INTO ${table} (
				uuid,
				changeid,
				name,
				url,
				homepage,
				favicon,
				country,
				countrycode,
				state,
				language,
				tags,
				codec,
				timezone
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT (uuid) 
			DO UPDATE SET
				changeid = excluded.changeid,
				name = excluded.name,
				url = excluded.url,
				homepage = excluded.homepage,
				favicon = excluded.favicon,
				country = excluded.country,
				countrycode = excluded.countrycode,
				state = excluded.state,
				language = excluded.language,
				tags = excluded.tags,
				codec = excluded.codec,
				timezone = COALESCE(timezone, excluded.timezone)
			RETURNING id, favourite`;

		this.transaction(db => {

			const stmt = db.prepare(sql);

			for (const s of stations) {

				const row = stmt.get(
					s.uuid,
					s.changeid,
					s.name,
					s.url,
					s.homepage || null,
					s.favicon || null,
					s.country || null,
					s.countrycode || null,
					s.state || null,
					s.language || null,
					s.tags || null,
					s.codec,
					s.timezone || 'UTC'
				);

				s.id = row.id;
				s.favourite = row.favourite;
			}

		});
	}

	getFavourite() {

		try {
			return super.query(RadioDatabase.view, {
				limit: 50,
				where: { favourite: 1 },
				order: ['rating', 'DESC']
			});
		}
		catch (e) {
			console.error('🚨 Failed to load favourite stations:', e);
			return [];
		}
		
	}

	getRecent() {
		try {
			return super.query(RadioDatabase.view, {
				limit: 20,
				where: { played_at: 'not_null', favourite: 0 },
				order: ['played_at', 'DESC']
			});
		}
		catch (e) {
			console.error('🚨 Failed to load recent stations:', e);
			return [];
		}
    }

	setFavourite(uuid, enable) {
		try {
			this.update({ uuid }, { favourite: enable ? 1 : 0 });
		}
		catch (e) {
			console.error('🚨 Failed to set favourite:', e);
		}
	}

	updateLastPlayed(id) {

		const table = `${RadioDatabase.table}_stat`;

		try {
			super.update(table, id, { 
				played_at: 'timestamp()',
				rating: 'increment()'
			});
		}
		catch (e) {
			console.error('🚨 Failed to udapte last played:', e);
		}
	}

	getSearchCache(query) {
		return super.find(RadioDatabase.cache, 'query', query);
	}

	updateSearchCache(query, offset, more) {
		

		const table = this.table(RadioDatabase.cache);

		this.db.prepare(`
			INSERT OR REPLACE INTO ${table}
			(query, offset, more, last_updated) 
			VALUES(?, ?, ?, CURRENT_TIMESTAMP)`)
			.run(
				query,
				offset,
				more ? 1 : 0
			);
	}	

	addRecording(recording) {
		return super.insert('recording', recording);		
	}

	removeRecording(id) {
		super.delete('recording', id);
	}

	updateRecording(id, data) {
		super.update('recording', id, data);
	}

	getRecordings(stationId) {
		return super.query('recordings', { where: { station_id: stationId } });
	}

	getAllRecordings() {
		return super.ls('station_recordings', 0, 200);
	}

	cleanRecordings() {
		this.prepare("DELETE FROM recording WHERE repeat = 'None' AND end_time < datetime()").run();
	}
}

