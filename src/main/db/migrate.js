import fs from 'fs';
import path from 'path';

//import seedSQL from './sql/migrations/001_seed_initial_data.sql?raw';

const migrations = [
//   {
//     name: '001_seed_initial_data',
//     sql: seedSQL
//   }
];

export function runMigrations(db, migrations=[]) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS migrations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT UNIQUE,
		run_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
	`);

	const applied = db.prepare(`SELECT name FROM migrations`).all()
		.map(r => r.name);

	for (const m of migrations) {
		if (applied.includes(m.name)) continue;

		const [sql, params] = m.sql;

		db.exec('BEGIN');

		console.debug('Executing migration:');
		console.debug(sql);

		try {


			db.prepare(sql).run(...params);
			db.prepare(`INSERT INTO migrations (name) VALUES (?)`).run(m.name);

			db.exec('COMMIT');
		} catch (err) {
			db.exec('ROLLBACK');
			throw err;
		}
	}
}