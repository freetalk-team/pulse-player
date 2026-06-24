
import album_theaudiodb from './components/builtin/album_theaudiodb';
import track_theaudiodb from './components/builtin/track_theaudiodb';
import album_musicbrainz from './components/builtin/album_musicbrainz';

import { run } from './components/execute';

const migrations = [
	album_theaudiodb
	, track_theaudiodb
	//, album_musicbrainz
]
	.map((component, index) => ({
		name: component.name,
		sql: generateSql(component, index + 1)
	}));

function generateSql(component, priority) {

	const config = {};

	for (const prop of component.schema)
		if (prop.default)
			config[prop.key] = prop.default;

	return ['INSERT INTO components(name, description, type, code, config, schema, builtin, enabled, priority) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?)',
		[
			component.name, 
			component.description,
			component.type,
			component.code,
			JSON.stringify(config),
			JSON.stringify(component.schema),
			priority
		]
	];
}

export {
	run,
	migrations
}