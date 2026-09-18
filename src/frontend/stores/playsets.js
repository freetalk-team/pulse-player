import { writable, get } from 'svelte/store';

import { randomIcon, randomColor } from '../components/ui/icons';

import { selectedPlayset, selectFilter } from './player';
import { activeOrder, searchQuery, activeEditPlayset, activeEditPlaysetMembers, activeEditPlaylist, editMode } from './selection';
import { playsetCount } from './library';
import { collections } from './collections';
import { confirmAction } from './ui';
import { fetchCall } from './fetch';
import { playSet } from './play';

export const top = writable([]);
export const playsets = writable([]);

export const isLoading = writable(false);
export const hasMore = writable(false);

const queryPlaysets = fetchCall(api.queryPlaysets, playsets, isLoading, hasMore, buildQuery);
export const fetch = (reset) => queryPlaysets({}, reset);

let loaded = false;
let lastUpdatedPlayset;

activeEditPlaysetMembers.subscribe((members, reorder) => {
	const id = get(activeEditPlayset)?.id;
	if (!id) return;

	if (!reorder)
		updatePlaysetStat(id, members);

	updatePlaysetOrder(id, members);
});

export async function loadPlaysets() {
	if (loaded) return;

	const playsets = await api.getPlaysets();
	top.set(playsets);

	console.debug('Top playsets:', playsets);

	loaded = true;
}

export async function createPlayset(name, sets=[], edit=false, select=false) {

	const members = sets || [];
	const icon = `${randomIcon()} ${randomColor()}`;

	console.debug('Create playset:', name, members);

	const id = await api.createPlayset({ name, icon, members });
	// Refresh list
	// loadPlaysets();
	if (!id) {
		report.error('Failed to create playset');
		return null;
	}

	const playset = { id, name, icon, type: 'playset',
		member_count: members.length, 
		total_rating: members.map(i => i.total_rating).sum(), 
		total_duration: members.map(i => i.total_duration).sum(), 
	};

	top.update(list => [playset, ...list]);
	playsets.update(list => [playset, ...list]);
	playsetCount.update(n => n + 1);

	if (edit) {
		activeEditPlayset.set(playset);
		activeEditPlaysetMembers.value = members;

		editMode.set('playset');
	}

	if (select)
		selectedPlayset.set(playset);

	report.success('Playset created');

	return playset;
}

export async function editPlayset(playset) {
	if (!playset)
		playset = get(selectedPlayset);

	const members = await loadPlaysetMembers(playset.id);

	console.debug('Playset members:', members);

	activeEditPlaylist.set(null);
	activeEditPlayset.set(playset);
	activeEditPlaysetMembers.value = members;

	editMode.set('playset');
}

export async function deletePlayset(playset) {

	const selected = get(selectedPlayset);
	const active = get(activeEditPlayset);

	if (!playset) 
		playset = selected;

	const confirmed = await confirmAction({
		title: 'Delete playset?',
		message: `This will permanently remove "${playset.name}". Your music files won't be touched.`,
		confirmText: 'Delete',
		danger: true
	});

	if (confirmed) {
		// Only now do we call the SQLite delete
		// await api.deleteplayset(playset.id);

		// selectFilter('all');

		top.update(list => list.filter(p => p.id !== playset.id));
		playsets.update(list => list.filter(p => p.id !== playset.id));
		collections.update(list => list.filter(p => !(p.type == 'playset' && p.id == playset.id)));

		playsetCount.update(n => n - 1);

		await api.deletePlayset(playset.id);

		if (playset.id == selected?.id)
			selectFilter('all');

		if (playset.id == active?.id) {
			editMode.set(null);
			activeEditPlayset.set(null);
		}
	}

}

export function playPlayset(playset, force) {
	if (!playset)
		playset = get(selectedPlayset);

	playSet(playset, force);
}

export async function renamePlayset(id, newName, updateActive=true) {
	const data = { name: newName };

	updateStores(id, data, updateActive);

	await api.updatePlayset(id, data);
}

export async function updatePlaysetMeta(playset) {
	const id = playset.id;
	const data = {
		icon: playset.icon,
		genre: playset.genre || 'Various'
	};

	if (playset.name)
		data.name = playset.name;

	// console.debug('Updating playlist:', id, data);

    updateStores(id, data);

	await api.updatePlayset(id, data);
}

function updatePlaysetStat(id, members) {

	const data = {
		member_count: members.length,
		total_rating: members.map(i => i.total_rating).sum(),
		total_duration: members.map(i => i.total_duration).sum()
	};

	updateStores(id, data);
}

async function updatePlaysetOrder(playsetId, members, startIndex=-1) {
	await api.updatePlaysetOrder(playsetId, members, startIndex);
}

export async function addMemberToPlayset(playset, member) {

	const selected = get(selectedPlayset);
	const active = get(activeEditPlayset);

	let currentMembers, isActive = false;

	if (!playset) {
		playset = active;
	}

	const playsetId = playset.id;

	if (playset.id == active?.id) {
		isActive = true;
		currentMembers = activeEditPlaysetMembers.value;
	}
	else {
		if (playsetId == lastUpdatedPlayset?.id) {
			currentMembers = lastUpdatedPlayset.members;
		}
		else {
			currentMembers = await loadPlaysetMembers(playsetId);
			lastUpdatedPlayset = { id: playsetId, members: currentMembers };
		}
	}

	const members = (Array.isArray(member) ? member : [member])
		.filter(i => !currentMembers.find(m => m.type == i.type && m.id == i.id));

	if (members.length == 0) return;

	console.debug('Adding playset members:', isActive, playset.member_count, members);

	if (isActive) 
		activeEditPlaysetMembers.add(members);

	const data = {
		member_count: playset.member_count + members.length,
		total_rating: playset.total_rating + members.map(i => i.total_rating).sum(),
		total_duration: playset.total_duration + members.map(i => i.total_duration).sum()
	};

	updateStores(playsetId, data, isActive);

	await updatePlaysetOrder(playsetId, members, currentMembers.length);

	currentMembers.push(...members);
}

function updateStores(id, data, updateActive) {
	top.update(list => list.map(p => p.id === id ? { ...p, ...data } : p));
	playsets.update(list => list.map(p => p.id === id ? { ...p, ...data } : p));
	collections.update(list => list.map(p => p.type == 'playset' && p.id === id ? { ...p, ...data } : p));

	// 2. Update Workbench if it's the active one
	if (updateActive) 
		activeEditPlayset.update(p => p && p.id === id ? { ...p, ...data } : p);
}

export function clearPlaysets() {
	top.set([]);
	playsets.set([]);
}

function buildQuery(params, lastRequest) {

	params.sort = params.sort || get(activeOrder);
	params.query = params.query || get(searchQuery);

	const changed = params.query != lastRequest.query ||
		params.sort != lastRequest.sort;

	Object.assign(lastRequest, params);

	return changed;
}


async function loadPlaysetMembers(id) {
	const members = await api.getPlaysetMembers(id);

	for (const m of members) {
		m.member_id = m.id;
		m.member_type = m.type;
		m.id = `${m.type}_${m.id}`;
	}

	return members;
}