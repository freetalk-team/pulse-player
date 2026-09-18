<script>

import { activeTab, selectedFilter } from '../../../stores/home';

import TrackView from '../track/View.svelte';
import AlbumView from '../album/View.svelte';
import PlaylistView from '../playlist/View.svelte';
import PlaysetView from '../playset/View.svelte';
import RadioView from '../radio/View.svelte';

</script>

{#if $activeTab == 'track'}
	<TrackView filter={selectedFilter} />
{:else if $activeTab == 'album'}
	<AlbumView />
{:else if $activeTab == 'playlist'}
	<PlaylistView />
{:else if $activeTab == 'playset'}
	<PlaysetView />
{:else if $activeTab == 'radio'}
	<RadioView />
{/if}