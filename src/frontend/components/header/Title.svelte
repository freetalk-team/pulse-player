<script>

import { selectedAlbum, selectedPlaylist, selectedFilter } from "../../stores/player";

</script>

<h2 class="font-lucida-sans uppercase text-2xl font-black tracking-tight truncate">
	{#if $selectedAlbum}
		{$selectedAlbum.name}
	{:else if $selectedPlaylist}
		{$selectedPlaylist.name}
	{:else if $selectedFilter === 'audio'}
		Audio tracks 
	{:else if $selectedFilter === 'video'}
		Video clips
	{:else if $selectedFilter === 'sets'}
		Playlists and albums
	{:else}
		Media
	{/if}
</h2>