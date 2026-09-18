<script>

import { albumCount, playlistCount, playsetCount, audioCount, videoCount, trackCount } from '../../stores/library';
import { selectFilter, selectedFilter } from '../../stores/player';

import FilterItem from './FilterItem.svelte';

import List from '../ui/ListEx.svelte';
import AlbumList from './AlbumList.svelte';
import PlaylistList from './PlaylistList.svelte';
import PlaysetList from './PlaysetList.svelte';


$: showTrackFilter = $audioCount > 0 && $videoCount > 0;
$: showCollectionsFilter = $albumCount > 0 && $playlistCount > 0;
// $: showSetsFilter = showCollectionsFilter > 0 && $playsetCount > 0;

$: library = [
	{
		filter: 'all',
		title: 'Media',
		icon: 'fa-icons',
		iconColor: 'text-pulse-accent',
		count: $trackCount,
		show: true
	},
	{
		filter: 'audio',
		title: 'Audio',
		icon: 'fa-music',
		iconColor: 'text-blue-400',
		count: $audioCount,
		show: showTrackFilter
	},
	{
		filter: 'video',
		title: 'Video',
		icon: 'fa-film',
		iconColor: 'text-purple-400',
		count: $videoCount,
		show: showTrackFilter
	},
	{
		filter: 'playsets',
		title: 'Playsets',
		icon: 'fa-sliders',
		iconColor: 'text-blue-400',
		count: $playsetCount,
		show: $playsetCount > 0
	},
	{
		filter: 'playlists',
		title: 'Playlists',
		icon: 'fa-list-ul',
		iconColor: 'text-orange-400',
		count: $playlistCount,
		show: $playlistCount > 0
	},
	{
		filter: 'albums',
		title: 'Albums',
		icon: 'fa-compact-disc',
		iconColor: 'text-purple-400',
		count: $albumCount,
		show: $albumCount > 0
	},
	{
		filter: 'collections',
		title: 'Collections',
		icon: 'fa-layer-group',
		iconColor: 'text-rose-400',
		count: $albumCount + $playlistCount,
		show: showCollectionsFilter
	}
	// {
	// 	filter: 'sets',
	// 	title: 'Sets',
	// 	icon: 'fa-bars-staggered',
	// 	iconColor: 'text-mist-400',
	// 	count: $albumCount + $playlistCount + $playsetCount,
	// 	show: showSetsFilter
	// }
];

</script>

<List 
	title="Library" 
	icon="fa-book-open" 
>
	{#each library as item}
		{#if item.show}
			<FilterItem 
				{item} 
				isSelected={$selectedFilter == item.filter}
				onSelect={() => selectFilter(item.filter)}
			/>
		{/if}
	{/each}
</List>

<PlaysetList />
<PlaylistList />
<AlbumList />