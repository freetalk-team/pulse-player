
import album_theaudiodb from './builtin/album_theaudiodb';
import track_theaudiodb from './builtin/track_theaudiodb';
import album_musicbrainz from './builtin/album_musicbrainz';

export const migrations = [
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
