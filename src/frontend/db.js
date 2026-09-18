
class IndexedDB {

	#setup = false;
	#initialized = false;

	get name() { return 'app'; }
	get version() { return 1; }
	get isSetup() { return this.#setup; }

	// public
	async init() {
		if (this.#initialized) return;

		if (!window.indexedDB) {
			console.log('Your browser doesn\'t support IndexedDB');
			throw new Error('IndexedDB is not supported');
		}

		this.db = await this.#openDatabase();

		if (this.isSetup) {
			await this.setup();
		}

		this.#initialized = true;

		//app.on('datechange', () => this.updateHistory());
	}

	async open() {
		if (this.#initialized) return;

		// if (!window.indexedDB) {
		// 	console.log('Your browser doesn\'t support IndexedDB');
		// 	throw new Error('IndexedDB is not supported');
		// }

		this.db = await this.#openDatabase();

		this.#initialized = true;
	}

	needSetup(ver) { return ver == 0; }

	setup() {}
	close() { this.db.close(); }

	ls(table, desc=false, offset=0, limit=100) { return this.#getAll(getTable(table), desc, offset, limit); }
	tail(table, offset=0, limit=50) { return this.#getAll(getTable(table), true, offset, limit); }
	lsByIndex(table, index, value, desc=false, limit=30, offset=0) { return this.#getAllByIndex(getTable(table), index, value, offset, limit, desc); }
	lsByRating(table, offset, limit) { return this.#getAllBy(getTable(table), 'rating', offset, limit, true); }
	lsByRange(table, index, range, desc=false, offset=0, limit=30) { return IndexedDB.range(this.db, getTable(table), index, range, desc, offset, limit); }
	latest(table, offset=0, limit=100, index='played_at') {  { return this.#getAllByIndex(getTable(table), index, 0, offset, limit, true); }}
	iterate(table, ...args) { return IndexedDB.iterate(this.db.getTable(table), ...args); }

	count(table, ...args) { return IndexedDB.count(this.db, getTable(table), ...args); }

	// insert/update single record
	put(table, data) { return IndexedDB.put(this.db, getTable(table), data); }
	update(table, ...args) { return this.#update(getTable(table), ...args); }
	updateByIndex(table, ...args) { return this.#updateByIndex(getTable(table), ...args); }
	push(table, ...args) { return this.#push(getTable(table), ...args); }
	upsert(table, data, update) { return IndexedDB.upsert(this.db, getTable(table), data, update); }

	get(table, id) { return this.#getById(getTable(table), id); }
	getMany(table, ids) { return IndexedDB.getMany(this.db, getTable(table), ids); }
	search(table, query, index, range, desc=false, offset=0, limit=30) { return IndexedDB.search(this.db, getTable(table), query, index, range, desc, offset, limit); }
	rm(table, id) { return this.#rm(getTable(table), id); }
	rmByIndex(table, index, id) { return this.#rmByIndex(getTable(table), index, id); }

	pushValue(table, id, key, value) { return this.#pushValue(getTable(table), id, key, value); }
	pushValueByIndex(table, index, id, key, value) { return this.#pushValueByIndex(getTable(table), index, id, key, value); }
	deleteValue(table, ...args) { return this.#deleteValue(getTable(table), ...args); }
	deleteValueByIndex(table, ...args) { return this.#deleteValueByIndex(getTable(table), ...args); }

	// add one or multiple records
	add(table, data) { return IndexedDB.add(this.db, getTable(table), data); }

	getById(id) { return this.#getById(kContact, id); }
	find(table, index, val) { return IndexedDB.find(this.db, table, index, val); } 

	tokenize(text) { return IndexedDB.tokenize(text); }

	// private
	#openDatabase() {

		const name = this.name;
		const version = this.version;

		return new Promise((resolve, reject) => {
	
			// const request = upgrade ? indexedDB.open('app', kVersion) : indexedDB.open('app');
			const request = indexedDB.open(name, version);
		
			request.onerror = (event) => {
				console.error(`Database error: ${event.target.errorCode}`);
				reject(event.target.errorCode);
			};
			
			request.onsuccess = (event) => {
				const db = event.target.result;
				resolve(db);
		
				// if (!upgrade) {
		
				// 	const ver = db.version ? parseInt(db.version) : 0;
		
				// 	if (ver < kVersion) {
				// 		db.close();
				// 		// needs upgrade
						
				// 		doOpenDatabase(resolve, reject, true);
				// 		return;
				// 	}
				// 	else {
				// 		resolve(db);
				// 	}
				// }
			};
		
			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				const txn = event.target.transaction;
				const ver = event.oldVersion;

				this.onUpgrade(db, txn, ver);

				if (this.needSetup(ver)) {
					this.#setup = true;
				}
		
			}
		});
	}
	
	#getAllByIndex(table, index, value, offset=0, limit=50, desc=false) {

		// console.log('Loading history:', offset);

		return new Promise((resolve, reject) => {
			const txn = this.db.transaction(table, 'readonly');
			const store = txn.objectStore(table);

			console.debug('[DB] get all by index:', index, value);

			const key = value === undefined || value === null ? IDBKeyRange.lowerBound(0) : IDBKeyRange.only(value);
			const idx = store.index(index);
			const request = idx.openCursor(key, desc ? 'prev' : 'next')

			let moved = offset == 0;
			let count = 0;
			let ts;

			const r = [];

			request.onsuccess = (event) => {


				const c = event.target.result;
				//console.log(c);

				if (c) {

					//console.log('### CURSOR');

					if (!moved) {
						moved = true;
						c.advance(offset);
					}
					else {

						const i = c.value;

						r.push(i);
						count++;

						if (count < limit) {
							c.continue();
						}
						else {
							resolve(r);
						}

					}
					
				} else {
					resolve(r);
				}

				
			};

			request.onerror = e => {
				reject(e);
			}
		});
	}

	addOne(table, data) {

		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);

			// console.log('IndexedDB: adding new entry =>', table, data);
			let query = store.add(data);

			// handle success case
			query.onsuccess = resolve;

			// handle the error case
			query.onerror = reject;

			// close the database once the 
			// transaction completes
			// txn.oncomplete = function () {
			// 	db.close();
			// };
		});
	}

	#rm(table, id) {

		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);

			// console.log('IndexedDB: adding new entry =>', table, data);
			let query = id ? store.delete(id) : store.clear();

			// handle success case
			query.onsuccess = function (event) {
				// console.log(event);
				resolve();
			};

			// handle the error case
			query.onerror = function (event) {
				console.log(event.target.errorCode);
				reject(event.target.errorCode);
			}
		});
	}

	#rmByIndex(table, index, id) {

		return new Promise((resolve, reject) => {

			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);
			const idx = store.index(index);
			
			const cur = idx.openCursor(id);

			// cur.onerror = reject;
			cur.onerror = resolve;
			cur.onsuccess = event => {

				const cursor = event.target.result;

				if (!cursor) {
					resolve();
					return;
				}

				const req = cursor.delete();

				//req.onerror = reject;
				//req.onsuccess = resolve;

				cursor.continue();
			}

		});
	}

	#update(table, id, data, init={}) {
		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);

			const cursor = store.openCursor(IDBKeyRange.only(id));

			cursor.onsuccess = (event) => {
				const cursor = event.target.result;
				let query;

				if (cursor) {
					const value = Object.assign(cursor.value, data);
					query = cursor.update(value);
				}
				else {
					const value = { id, ...init, ...data};
					// console.log('INDEX update new:', value);

					query = store.add(value);
				}
				
				query.onsuccess = function (event) {
					// console.log(event);
					resolve();
				};
	
				// handle the error case
				query.onerror = reject;
			}

			cursor.onerror = reject;

		});
	}

	#updateByIndex(table, index, key, data, init={}) {
		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);

			const idx = store.index(index);
			// query by indexes
			//const query = i.get(value);

			const cursor = idx.openCursor(key);

			cursor.onsuccess = (event) => {
				const cursor = event.target.result;
				let query;

				if (cursor) {

					const value = Object.assign(cursor.value, data);
					Object.deleteUndefined(value);

					query = cursor.update(value);
				}
				else {
					const value = { ...init, ...data};

					// console.log('INDEX update new:', value);

					query = store.add(value);
				}
				
				query.onsuccess = function (event) {
					// console.log(event);
					resolve();
				};
	
				// handle the error case
				query.onerror = reject;
			}

			cursor.onerror = reject;

		});
	}

	#pushValue(table, id, key, value) {
		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);
			const cursor = store.openCursor(IDBKeyRange.only(id));

			pushValue(key, value, cursor, resolve, reject);
		});
	}

	#pushValueByIndex(table, index, id, key, value) {
		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);
			const idx = store.index(index);
			
			const cursor = idx.openCursor(id);

			pushValue(key, value, cursor, resolve, reject);
		});
	}

	#deleteValue(table, id, key, value) {
		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);
			const cursor = store.openCursor(IDBKeyRange.only(id));

			deleteValue(key, value, cursor, resolve, reject);

		});
	}

	#deleteValueByIndex(table, index, id, key, value) {
		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);
			const idx = store.index(index);
			
			const cursor = idx.openCursor(id);

			deleteValue(key, value, cursor, resolve, reject);

		});
	}

	#push(table, id, child, data) {
		return new Promise((resolve, reject) => {
			// create a new transaction
			const txn = this.db.transaction(table, 'readwrite');

			// get the Contacts object store
			const store = txn.objectStore(table);

			const cursor = store.openCursor(IDBKeyRange.only(id));

			cursor.onsuccess = (event) => {
				const cursor = event.target.result;
				let query;

				if (!cursor) return reject('Appending to non-existing record');
				
				const v = cursor.value;
				if (v[child])
					v[child].push(data);
				else
					v[child] = [data];

				if (v.ts)
					v.ts = Date.seconds();

				query = cursor.update(v);

				query.onsuccess = function (event) {
					console.log(event);
					resolve();
				};
	
				// handle the error case
				query.onerror = function (event) {
					console.log(event.target.errorCode);
					reject(event.target.errorCode);
				}
			}

			cursor.onerror = reject;

		});
	}

	#getById(table, id) {
		// console.log('CONTACT: getById =>', table, id);

		return new Promise((resolve, reject) => {
			const txn = this.db.transaction(table, 'readonly');
			const store = txn.objectStore(table);

			let query = store.get(id);

			query.onsuccess = (event) => {
				if (!event.target.result) {
					// console.debug(`IndexedDB: ${id} not found in ${table}`);
					// reject();
					resolve(null);
				} else {
					// console.table(event.target.result);
					resolve(event.target.result);
				}
			};

			query.onerror = reject;

		});
	}

	#getAll(table, desc, offset, limit) {
		return new Promise((resolve, reject) => {
			const txn = this.db.transaction(table, "readonly");
			const store = txn.objectStore(table);

			const res = [];
			const request = store.openCursor(null, desc ? 'prev' : 'next');

			let moved = offset == 0;
			let count = 0;

			request.onsuccess = (event) => {
				let c = event.target.result;
				if (c) {
					if (!moved) {
						moved = true;
						c.advance(offset);
					}
					else {
						let i = c.value;
						//console.log(contact);
						res.push(i);
						// continue next record

						if (++count < limit) {
							c.continue();
						}
						else {
							resolve(res);
						}
					}
					
				}
				else {
					// console.log('IndexedDB:', table, '=>', res);
					resolve(res);
				}
			};

			request.onerror = reject;
			// close the database connection
			// txn.oncomplete = function () {
			// 	db.close();
			// };
		});
	}

	#getAllBy(table, index,  offset=0, limit=50, desc=false) {

		// console.log('DB: get by rating request', offset);

		return new Promise((resolve, reject) => {
			const txn = this.db.transaction(table, 'readonly');
			const store = txn.objectStore(table);

			const key = IDBKeyRange.lowerBound(0);

			const idx = store.index(index);
			const request = idx.openCursor(key, desc ? 'prev' : 'next');

			let moved = offset == 0;
			let count = 0;

			const r = [];

			request.onsuccess = (event) => {


				const c = event.target.result;
				//console.log(c);

				if (c) {

					//console.log('### CURSOR');

					if (!moved) {
						moved = true;
						c.advance(offset);
					}
					else {

						const i = c.value;

						r.push(i);
						count++;

						if (count < limit) {
							c.continue();
						}
						else {
							resolve(r);
						}

					}
					
				} else {
					resolve(r);
				}

				
			};

			request.onerror = reject;
		});
		
	}


	static put(db, table, data) {
		const txn = db.transaction(table, 'readwrite');
		const store = txn.objectStore(table);

		const items = Array.isArray(data) ? data : [data];

		const requests = items.map((item) => {
			return new Promise((resolve, reject) => {
				const request = store.put(item);

				request.onsuccess = () => {
					resolve(request.result);
				};

				request.onerror = () => {
					reject(request.error);
				};
			});
		});

		const transactionComplete = new Promise((resolve, reject) => {
			txn.oncomplete = resolve;
			txn.onerror = () => reject(txn.error);
			txn.onabort = () => reject(txn.error);
		});

		return Promise.all([
			Promise.all(requests),
			transactionComplete
		]).then(([ids]) => ids);
	}

	static add(db, table, data) {
		const txn = db.transaction(table, 'readwrite');
		const store = txn.objectStore(table);

		const items = Array.isArray(data) ? data : [data];

		const requests = items.map((item) => {
			return new Promise((resolve, reject) => {
				const request = store.add(item);

				request.onsuccess = () => {
					resolve(request.result);
				};

				request.onerror = () => {
					reject(request.error);
				};
			});
		});

		const transactionComplete = new Promise((resolve, reject) => {
			txn.oncomplete = resolve;
			txn.onerror = () => reject(txn.error);
			txn.onabort = () => reject(txn.error);
		});

		return Promise.all([
			Promise.all(requests),
			transactionComplete
		]).then(([ids]) => ids);
	}

	static find(db, table, index, value) {
		const txn = db.transaction(table, 'readonly');
		const store = txn.objectStore(table);
		const idx = store.index(index);
		const request = idx.get(value);

		return new Promise((resolve, reject) => {
			request.onsuccess = () => {
				resolve(request.result ?? null);
			};

			request.onerror = () => {
				reject(request.error);
			};
		});
	}

	static async getMany(db, table, ids) {

		const txn = db.transaction(table, 'readonly');
		const store = txn.objectStore(table);

		return Promise.all(
			ids.map(id => new Promise((resolve, reject) => {
				const request = store.get(id);

				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			}))
		);
	}

	static getAllByIndexValues(db, table, indexName, values) {
		const txn = db.transaction(table, 'readonly');
		const index = txn.objectStore(table).index(indexName);

		return Promise.all(
			values.map(value => new Promise((resolve, reject) => {
				const request = index.getAll(value);

				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			}))
		).then(results => results.flat());
	}

	static range(db, table, index, [start, end], desc=false, offset=0, limit=30) {

		const request = this.requestRange(db, table, index, start, end, desc);

		return new Promise((resolve, reject) => {

			const r = [];

			let moved = offset == 0;
			let count = 0;

			request.onsuccess = (event) => {
				const c = event.target.result;

				if (c) {

					if (!moved) {
						moved = true;
						c.advance(offset);
					}
					else {

						const i = c.value;

						r.push(i);
						count++;

						if (count < limit) {
							c.continue();
						}
						else {
							resolve(r);
						}

					}
					
				} else {
					resolve(r);
				}

			};

			request.onerror = reject;
		});
	}

	static count(db, table, indexName = null, query = undefined) {
		const txn = db.transaction(table, 'readonly');
		const store = txn.objectStore(table);

		const source = indexName
			? store.index(indexName)
			: store;

		const request = source.count(query);

		return new Promise((resolve, reject) => {
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	static delete(db, table, index, start, end) {
		const txn = db.transaction(table, 'readwrite');
		const store = txn.objectStore(table);

		let key, request;

		if (index) {

			if (start == end)
				key = IDBKeyRange.only(start);
			else if (!start)
				key = IDBKeyRange.upperBound(end, true); // < y
			else if (!end)
				key = IDBKeyRange.lowerBound(start); // >= x
			else
				key = IDBKeyRange.bound(start, end, false, true); // >= x && < y

			

			const idx = store.index(index);
			request = idx.openCursor(key);
		}
		else {
			request = store.openCursor();
		}

		return new Promise((resolve, reject) => {
			request.onsuccess = (event) => {
				let cursor = event.target.result;
				if (cursor) {
					cursor.delete();
					cursor.continue();
				}
				else {
					resolve();
				}
			}
			
			request.onerror = reject;
		});
	}

	static clear(db, table) {
		const txn = db.transaction(table, 'readonly');
		const store = txn.objectStore(table);
		const request = store.clear();

		return new Promise((resolve, reject) => {
			request.onsuccess = resolve;
			request.onerror = reject;
		});
	}

	static search(db, table, query, index, [start, end], desc=false, offset=0, limit=30) {
		const request = this.requestRange(db, table, index, start, end, desc);

		const tokens = this.tokenize(query);
    	if (tokens.length === 0) return [];

		return new Promise((resolve, reject) => {

			const res = [];

			let moved = 0;
			let count = 0;

			request.onsuccess = (event) => {
				let c = event.target.result;

				if (c) {

					const value = c.value;

					if (match(value.fts)) {

						if (moved++ < offset) {
							c.continue();
						}
						else {
							count++;
							res.push(value);

							if (count < limit) 
								c.continue();
							else 
								resolve(res);
						}
					}
					else {
						c.continue();
					}
				}
				else {
					resolve(res);
				}
			};

			request.onerror = reject;
		});

		function match(vector) {
			for (const token of tokens) {
				for (const t of vector) {
					if (t.startsWith(token)) 
						return true;
				}
			}

			return false;
		}
	}

	static requestRange(db, table, index, start, end, desc=false) {
		const txn = db.transaction(table, 'readonly');
		const store = txn.objectStore(table);

		let key;
		if (!start)
			key = IDBKeyRange.upperBound(end, true); // < y
		else if (!end)
			key = IDBKeyRange.lowerBound(start); // >= x
		else
			key = IDBKeyRange.bound(start, end, false, true); // >= x && < y

		const idx = store.index(index);
		
		return idx.openCursor(key, desc ? 'prev' : 'next');
	}

	static iterate(db, table, index, start, end, callback, acc = {}) {
		const request = this.requestRange(db, table, index, start, end);

		return new Promise((resolve, reject) => {
			request.onsuccess = (event) => {
				let c = event.target.result;

				if (c) {
					callback(c.value, acc);
					c.continue();
				}
				else {
					resolve(acc);
				}
			};

			request.onerror = reject;
		});
	}

	static request(request) {
		return new Promise((resolve, reject) => {
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	static async upsert(db, table, records, update) {
		const txn = db.transaction(table, 'readwrite');
		const store = txn.objectStore(table);

		for (const record of records) {
			const existing = await this.request(store.get(record.id));

			if (existing !== undefined) {
				const updated = update(existing, record);

				if (updated !== undefined) {
					store.put(updated);
				}
			} else {
				store.add(record);
			}
		}

		return new Promise((resolve, reject) => {
			txn.oncomplete = resolve;
			txn.onerror = () => reject(txn.error);
			txn.onabort = () => reject(txn.error);
		});
	}

	static tokenize(text) {

		// Convert to lowercase, remove special chars, split by whitespace
		const words = text.normalize('NFKD')
			.toLowerCase()
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^\p{L}\p{N}\s]/gu, ' ')
			//.replace(/[^a-z0-9\s]/g, '')
			.split(/\s+/)
			.filter(word => word.length > 2);
		
		// Generate n-grams for partial matching (optional)
		const tokens = new Set();
		words.forEach(word => {
			// Add whole word
			tokens.add(word);
			// Add n-grams for fuzzy matching (3-grams)
			// for (let i = 0; i <= word.length - 3; i++) {
			// 	tokens.add(word.substring(i, i + 3));
			// }
		});
		
		return Array.from(tokens);
	}

	static addTable = addTable;
	static addIndex = addIndex;

	static deleteTable = deleteTable;
	static deleteIndex = deleteIndex;
}

function pushValue(key, value, cursor, resolve, reject) {

	cursor.onsuccess = (event) => {
		const cursor = event.target.result;
		let query;

		if (cursor) {

			const data = cursor.value;

			if (!data[key])
				data[key] = [];

			if (Array.isArray(value)) data[key].push(...value);
			else data[key].push(value);

			query = cursor.update(data);

			query.onsuccess = resolve;
			query.onerror = reject;
		}
		else {
			resolve();
		}
		
		
	}

	cursor.onerror = reject;
}

function deleteValue(key, value, cursor, resolve, reject) {

	cursor.onsuccess = (event) => {
		const cursor = event.target.result;
		let query;

		if (cursor) {

			const data = cursor.value;
			const item = data[key];

			if (Array.isArray(item) && value) {
				data[key] = item.filter(i => i != value);
			}
			else {
				delete data[key];
			}

			query = cursor.update(data);

			query.onsuccess = function (event) {
				// console.log(event);
				resolve();
			};

			// handle the error case
			query.onerror = reject;
		}
		else {
			resolve();
		}
		
		
	}

	cursor.onerror = reject;
}

function getTable(table) {
	return table;
}

function addTable(db, name, autoIncrement=false, keyPath='id') {
	const opt = { keyPath, autoIncrement };
	db.createObjectStore(name, opt);
}

function deleteTable(db, name) {
	db.deleteObjectStore(name);
}

function addIndex(table, index, txn, unique=false, name) {
	if (!name)
		name = Array.isArray(index) ? index.join('_') : index;

	// get the Contacts object store
	const store = txn.objectStore(table);
	store.createIndex(name, index, { unique });
}

function deleteIndex(table, index, txn) {
	// get the Contacts object store
	const store = txn.objectStore(table);
	store.deleteIndex(index);
}

export class Database extends IndexedDB {

	#name = 'app';

	get name() { return this.#name; }
	get version() { return 1; }

	constructor(name) {
		super();

		if (name)
			this.#name = name;
	}

	
}

/*

IDBKeyRange.bound( [2,0], [3,0], false, true);

*/