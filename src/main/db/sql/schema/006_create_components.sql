
CREATE TABLE IF NOT EXISTS components (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT,
	description TEXT,
	type TEXT NOT NULL,          -- 'album', 'track', etc.
	code TEXT,
	schema TEXT DEFAULT '{}',    -- JSON: APi schema
	config TEXT DEFAULT '{}',    -- JSON: API keys, headers, options

	builtin BOOLEAN DEFAULT 0,
	enabled BOOLEAN DEFAULT 1,
	priority INTEGER DEFAULT 1,

	timeout INTEGER DEFAULT 5000,

	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME
);

--INSERT INTO sqlite_sequence (name, seq) VALUES ('<table name>', <value>)