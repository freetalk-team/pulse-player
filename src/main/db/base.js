
import { DatabaseSync } from 'node:sqlite';
import { parse, join } from 'node:path';
import fs from 'node:fs';


export class DatabaseBase {

	#db;
	#alias = '';

	get db() { return this.#db; }
	get location() { return this.#db.location(); }
	get version() { return 1; }

	static create(root, opt={}) {
		const filename = this.dbname + '.db';
		const path = join(root, filename);
		return new this(path, opt);
	}

	constructor(dbPath, opt={}) {
		if (dbPath)
			this.#db = new DatabaseSync(dbPath, opt);
	}

	init(name, storage) {

		console.debug('Initializing DB:', name);


		const root = storage.databaseDir;
		const filename = name + '.db';

		// const dbPath = join(root, name + '.db');
		const dbPath = join(root, filename);
		const exists = fs.existsSync(dbPath);

		this.#db = new DatabaseSync(dbPath);

		const version = storage.getDatabaseVersion(name);

		console.debug('DB:', dbPath, `exists=${exists}`, `ver=${version}`);

		if (!exists) {
			this.onCreate();

			storage.setDatabaseVersion(name, this.version);
		}
		else if (version < this.version) {
			this.onUpgrade(version);

			storage.setDatabaseVersion(name, this.version);
		}

	}

	onCreate() {}
	onUpgrade() {}

	close() {
		console.debug('Closing database:', this.#db.location());
		this.#db.close();
	}

	exec(sql) {
		this.#db.exec(sql);
	}

	prepare(sql) {
		return this.#db.prepare(sql);
	}

	table(table) {
		return `${this.#alias}${table}`;
	}

	get(table, id, columns) {
		try {

			const cols = columns 
				? Array.isArray(columns) ? columns.join(',') : columns
				: '*';

			return this.#db.prepare(`SELECT ${cols} FROM ${this.table(table)} WHERE id=?`).get(id);
		}
		catch (e) {
			console.error(`🚨 Failed to fetch ${table}:`, e);
		}
	}

	find(table, column, value) {
		const sql = `SELECT * FROM ${this.table(table)} WHERE ${column}=?`;

		console.debug('[DB] find:', sql);

		try {
			return this.#db.prepare(sql).get(value);
		}
		catch (e) {
			console.error(`🚨 Failed to find ${table}:`, e);
		}

		return null;
	}

	ls(table, offset=0, limit=50) {
		try {
			return this.#db
				.prepare(`SELECT * FROM ${this.table(table)} LIMIT ? OFFSET ?`)
				.all(limit, offset);
		}
		catch (e) {
			console.error(`🚨 Failed to fetch ${table}:`, e);
		}
	}

	tail(table, offset=0, limit=50, orderBy='id') {
		try {
			return this.#db
				.prepare(`SELECT * FROM ${this.table(table)} ORDER BY ${orderBy} DESC LIMIT ? OFFSET ?`)
				.all(limit, offset);
		}
		catch (e) {
			console.error(`🚨 Failed to fetch ${table}:`, e);
		}
	}

	query(table, params={}) {

		if (params.query) {
			const query = params.query.trim().replace(/[^\w\s]/gi, '');

			if (query) 
				return this.search(table, query, params);
		}

		return this.fetch(table, params);
	}

	fetch(table, params) {
		const columns = params.columns
			? Array.isArray(params.columns) ? params.columns.join(',') : params.columns
			: '*';

		const json = params.json || [];
		const args = [];

		let where = '', order = '', offset = '';

		if (params.where && !Object.empty(params.where)) {

			const [sql, values] = buildWhere(params.where);

			where = 'WHERE ' + sql;

			args.push(...values);
		}

		if (params.order) {
			order = 'ORDER BY ' + buildOrder(params.order);
		}

		if ('offset' in params) {
			offset = 'LIMIT ? OFFSET ?';
			args.push(params.limit ?? 50, params.offset);
		}

		const sql = `
			SELECT ${columns}
			FROM ${this.table(table)}
			${where}
			${order}
			${offset}`;

		console.debug('[DB] query => ', sql, args);

		try {
			const rows = this.#db
				.prepare(sql)
				.all(...args);

			if (json.length > 0) {
				for (const row of rows) {
					for (const column of json) 
						row[column] = row[column] ? JSON.parse(row[column]) : null;
				}
			}

			console.debug('[DB] results:', rows.length);

			return rows;
		}
		catch (e) {
			console.error(`🚨 Failed to query ${table}:`, e);
		}

		return [];
	}

	search(table, query, params) {

		const limit = params.limit ?? 50;
		const offset = params.offset ?? 0;
		const columns = params.columns
			? Array.isArray(params.columns) ? params.columns.map(i => `t.${i}`).join(',') : params.columns
			: 't.*';

		const fts = this.table(params.fts || `${table}_search`);

		const json = params.json || [];
		const args = [`${query}*`];

		let where = `WHERE ${fts} MATCH ?`
			//, order = 'ORDER BY s.rank';
			, order = `ORDER BY bm25(${fts})`
			;

		if (params.where && !Object.empty(params.where)) {
			const [sql, values] = buildWhere(params.where, 't.');

			where += ' AND ' + sql;

			args.push(...values);
		}

		if (params.order) {
			order += ', ' + buildOrder(params.order, 't.');
		}

		args.push(limit, offset);

		const sql = `
			SELECT ${columns} 
			FROM ${fts} s JOIN ${this.table(table)} t ON t.id = s.rowid
			${where} 
			${order} 
			LIMIT ? OFFSET ?`;

		console.debug('[DB] search => ', sql, args);

		try {
			const rows = this.#db
				.prepare(sql)
				.all(...args);

			if (json.length > 0) {
				for (const row of rows) {
					for (const column of json) 
						row[column] = row[column] ? JSON.parse(row[column]) : null;
				}
			}

			console.debug('[DB] results:', rows.length);

			return rows;
		}
		catch (e) {
			console.error(`🚨 Failed to query ${table}:`, e);
		}

		return [];

	}

	insert(table, data, returning=['id']) {
		data = prepare(data);

		const columns = Object.keys(data);
		const values = Object.values(data);
		const placeholders = Array(columns.length).fill('?').join(',');
		const ret =  returning ? `RETURNING ${returning.join(',')}` : ''

		const sql = `
			INSERT INTO ${this.table(table)} (${columns.join(',')}) 
			VALUES (${placeholders})
			${ret}
			`;

		console.debug('[DB] insert:', sql, values);

		try {
			const row = this.#db.prepare(sql).get(...values);

			return returning 
				? returning.length > 1 ? row : row[returning[0]]
				: null;
		}
		catch (e) {
			console.error(`🚨 Failed to insert ${table}:`, e);
		}
	}

	update(table, id, data) {

		let where = 'id=?', wherevals = [];

		if (id == null) {
			id = data.id;
			delete data.id;

			wherevals.push(id);
		}
		else if (typeof id == 'object') {

			if (typeof data == 'object') {
				[where, wherevals] = buildWhere(id);
			}
			else {
				id = data.id;
				delete data.id;

				wherevals.push(id);
			}
		}

		const [placeholders, values] = buildUpdate(data);

		values.unshift(...wherevals);

		const sql = `
			UPDATE ${this.table(table)} SET ${placeholders}
			WHERE ${where}`;

		console.debug('[DB] update:', sql, values);

		try {
			this.#db.prepare(sql).run(...values);

			data.id = id;
		}
		catch (e) {
			console.error('🚨 Failed to update component:', e);
		}

	}

	increment(table, id, column, val=1) {
		try {
			return this.#db.prepare(`
				UPDATE ${table} SET ${column} = ${column} + ? WHERE id = ?
			`).run(val, id);
		}
		catch (e) {
			console.error('🚨 Failed to increment track rating:', error);
		}
	}

	delete(table, id) {
		const tbl = this.table(table);

		try {
			if (typeof id == 'object') {
				const [where, values] = buildWhere(id, this.#alias);
				this.#db.prepare(`DELETE FROM ${tbl} WHERE ${where}`).run(...values);
			}
			else {
				this.#db.prepare(`DELETE FROM ${tbl} WHERE id = ?`).run(id);
			}
		}
		catch (e) {
			console.error('🚨 Failed to delete:', e.message);
		}
	}

	count(table) {
		try {
			return this.#db.prepare(`SELECT COUNT(id) as count FROM ${this.table(table)}`)
				.get()
				.count;

		} catch (e) {
			console.error("SQL Error:", e.message);
		}

		return 0;
	}

	transaction(fn) {

		const db = this.#db;

		db.exec('BEGIN');

		try {

			fn(db);

			// console.log(db.prepare("SELECT sqlite_txn_state('main')").get());
			db.exec('COMMIT');
			// console.log(db.prepare("SELECT sqlite_txn_state('main')").get());

			//console.log("AFTER COMMIT");
		}
		catch (e) {
			console.error('🚨 Failed to execute transaction:', e);
			db.exec('ROLLBACK');
			// throw e;
		}
		
	}

	attach(pathOrDatabase, alias) {

		if (pathOrDatabase instanceof DatabaseBase) {

			const path = this.#db.location();

			this.close();

			const { name } = parse(path);

			this.#db = pathOrDatabase.db;
			this.#alias = alias || name;

			pathOrDatabase.attach(path, this.#alias);

			return;
		}


		if (!alias) {
			const { name } = parse(dbPath);
			
			alias = name;
		}

		this.#db.prepare(`ATTACH DATABASE ? AS ${alias}`).run(pathOrDatabase);
	}

	detach(alias) {
		this.#db.exec(`DETACH DATABASE ${alias}`);
	}

	runMigrations(migrations=[]) {

		const db = this.#db;

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

	enableOptimizations() {
		this.#db.exec(`
			PRAGMA journal_mode = WAL;
			PRAGMA synchronous = NORMAL;
			PRAGMA temp_store = MEMORY;
			PRAGMA foreign_keys = ON;
		`);
	}

	buildOrder(order, alias='') {
		return buildOrder(order, alias);
	}
}

function prepare(data) {
	Object.clean(data);

	for (const [key, value] of Object.entries(data)) {
		if (typeof value == 'object')
			data[key] = JSON.stringify(value); 
	}

	return data;
}

function buildWhere(where, alias='') {

	const placeholders = [];
	const values = [];

	for (const [key, value] of Object.entries(where)) {

		const col = `${alias}${key}`;

		if (value === null || value === 'null') {
			placeholders.push(`${col} IS NULL`);
		}
		else if (value === 'not_null') {
			placeholders.push(`${col} NOT NULL`);
		}
		else {

			switch (key) {
				case 'created_at':
				case 'updated_at':
				if (value) {
					placeholders.push(`${col} > ?`);
					values.push(value);
				}
				break;

				default:
				placeholders.push(`${col} = ?`);
				values.push(value);
				break;
			}

		}
	}

	return [placeholders.join(' AND '), values];
}

// function buildOrder(order, alias='') {
// 	return Array.isArray(order)
// 		? `${alias}${order[0]} ${order[1]}`
// 		: `${alias}${order} ASC`;
// }

function buildOrder(order, alias = '') {
	const orders = Array.isArray(order[0])
		? order
		: [order];

	return orders
		.map(item => {
			if (Array.isArray(item)) {
				return `${alias}${item[0]} ${item[1]}`;
			}

			return `${alias}${item} ASC`;
		})
		.join(', ');
}

function buildUpdate(data) {
	const placeholders = [];
	const values = [];

	for (const [key, value] of Object.entries(data)) {
		if (value == 'timestamp()') {
			placeholders.push(`${key} = CURRENT_TIMESTAMP`);
		}
		else if (value == 'increment()') {
			placeholders.push(`${key} = ${key} + 1`);
		}
		else {
			placeholders.push(`${key} = ?`);

			if (typeof value == 'object')
				values.push(JSON.stringify(value)); 
			else if (typeof value == 'boolean')
				values.push(value ? 1 : 0);
			else
				values.push(value); 
		}
	}

	return [placeholders.join(', '), values];
}

