import { DatabaseBase } from './base';

import createComponentsSQL from './sql/schema/006_create_components.sql?raw';


export class PluginDatabase extends DatabaseBase {

    static dbname = 'plugin';
    static table = 'components';
    
    init(storage) {

		super.init(PluginDatabase.dbname, storage);
    }

    onCreate() {
        this.exec(createComponentsSQL);
    }

    ls() {
        return this.query(PluginDatabase.table, {
            limit: 200,
            columns: ['id', 'name', 'description', 'type', 'builtin', 'enabled'],
            order: 'priority'
        });
    }

    get(id) {
        return super.get(PluginDatabase.table, id);
    }

    delete(id) {
        super.delete(PluginDatabase.table, id);
    }

    save(component) {
        if (component.id) 
            super.update(PluginDatabase.table, component);
        else 
            component.id = super.insert(PluginDatabase.table, component);

        return component.id;
    }

    enable(id, enable) {
        super.update(PluginDatabase.table, id, { enabled: enable });
    }

    updatePriority(components) {

		console.debug('Update components order:', components);

		this.transaction((db) => {
			// const stmt = db.prepare(`
			// 	UPDATE playlist_tracks 
			// 	SET position = ? 
			// 	WHERE playlist_id = ? AND track_id = ?
			// `);


			const stmt = db.prepare(`UPDATE ${PluginDatabase.table} set priority=? WHERE id=?`);

			for (const i of components)
				stmt.run(i.priority, i.id);
		});
	}

    getComponents(type) {
        return super.query(PluginDatabase.table, {
            limit: 100,
            columns: ['name', 'config', 'code', 'builtin'],
            json: ['config'],
            where: { enabled: 1, type },
            order: 'priority'
        });

    }
}