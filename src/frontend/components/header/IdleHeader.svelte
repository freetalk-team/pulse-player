<script>

import { currentLayout } from '../../stores/ui';
import { audioCount, videoCount, albumCount, playlistCount, playsetCount } from '../../stores/library';

import Title from './Title.svelte';

export let filter;
export let collection;

const Info = {
	home: {
		icon: 'fa-home',
		title: 'Library',
		description: 'Play tracks, albums and playlists'
	},
	remote: {
		icon: 'fa-share-nodes',
		title: 'Remote',
		description: 'Explore remote music'
	},
	radio: {
		icon: 'fa-radio',
		title: 'Online radio',
		description: 'Listen online radio stations (50K+)'
	},
	settings: {
		icon: 'fa-gear',
		title: 'Settings',
		description: 'Manage app settings'
	},
};

$: description = formatDescription(filter, collection);
$: current = Info[$currentLayout];

function formatDescription(filter, collection) {

	switch (filter) {
		case 'all':
		return formatCountDescription($audioCount + $videoCount, 'tracks');

		case 'audio':
		return formatCountDescription($audioCount, 'tracks');

		case 'video':
		return formatCountDescription($videoCount, 'tracks');

		case 'albums':
		return formatCountDescription($albumCount, 'albums');

		case 'playlists':
		return formatCountDescription($playlistCount, 'playlists');

		case 'playsets':
		return formatCountDescription($playsetCount, 'playsets');

		case 'collections':
		return formatCountDescription($albumCount + $playlistCount, 'collections');

		case 'sets':
		return formatCountDescription($albumCount + $playlistCount + $playsetCount, 'collections');

		default: 
		return formatCollectionDescription(collection);
	}
}

function formatCountDescription(count, items) {
	return `<i>${count} ${items}</i>`;
}

function formatCollectionDescription(collection) {

	const genre = collection.genre ? `<span class="text-pulse-accent">${collection.genre}</span>` : '';

	let desc = '';

	if (collection.artist) {
		desc += `<strong class="font-bold">${collection.artist}</strong>${genre ? ` • ${genre}` : ''}` + ' • ';
	}
	else if (collection.genre) {
		desc += genre + ' • ';
	}

	desc += formatCountDescription(collection?.track_count ?? 0, 'tracks');

	return desc;
}

function coverPath(cover) {
	const path = cover.split(',')[0];
	return platform.resolve(path);
}

function getIcon(filter) {
	switch (filter) {
		
		case 'audio':
		return 'fa-music text-blue-500';

		case 'video':
		return 'fa-film text-purple-500';

		case 'albums':
		return 'fa-compact-disc text-purple-500';

		case 'playlists':
		return 'fa-list-ul text-orange-500';

		case 'playsets':
		return 'fa-sliders text-blue-500';

		case 'collections':
		return 'fa-layer-group text-rose-500';

		case 'sets':
		return 'fa-bars-staggered text-mist-500';

		default: 
		return 'fa-icons text-pulse-accent';
	}
}
	
</script>

{#if $currentLayout == 'player'}
	<div class="area-icon flex items-center justify-center overflow-hidden rounded-lg shadow-lg bg-black/40 w-14 h-14 border border-white/5">

		{#if collection?.cover_path}
			<img src="{coverPath(collection.cover_path)}" class="w-full h-full object-cover" alt="" />
		{:else}
			<i class="fa-solid text-2xl {getIcon(filter)}"></i>
		{/if}
	</div>
	<div class="area-title flex items-end pb-1 min-w-0">
		<Title {filter} {collection} />
	</div>
	<div class="area-desc flex items-start min-w-0 mt-1">
		<p class="text-[10px] uppercase tracking-widest opacity-80 truncate">
			{@html description}
		</p>
	</div>
{:else}
	<div class="area-icon flex items-center justify-center overflow-hidden rounded-lg shadow-lg bg-black/40 w-14 h-14 border border-white/5">
		<i class="fa-solid text-2xl {current.icon}"></i>
	</div>
	<div class="area-title flex items-end pb-1 min-w-0">
		<h2 class="font-lucida-sans uppercase text-2xl font-black tracking-wider truncate">
			{current.title}
		</h2>
	</div>
	<div class="area-desc flex items-start min-w-0 mt-1">
		<p class="text-[10px] uppercase tracking-widest truncate text-gray-400">
			<i>{current.description}</i>
		</p>
	</div>
{/if}

<style>

.area-icon { grid-area: icon; }
.area-title { grid-area: title; }
.area-desc { grid-area: desc; }

</style>