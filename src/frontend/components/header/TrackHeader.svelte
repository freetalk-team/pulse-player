<script>

import { formatDescription } from '../../utils/format';

export let track;
export let album;
export let filter;

	
</script>

<div class="area-icon flex items-center justify-center overflow-hidden rounded-lg shadow-lg bg-black/40 w-14 h-14 border border-white/5">
	{#if track.thumb_path}
		<img src="{platform.resolve(track.thumb_path)}" class="w-full h-full object-cover" alt="" />
	{:else if album}
		{#if album.cover_path}
			<img src="{platform.resolve(album.cover_path)}" class="w-full h-full object-cover" alt="" />
		{:else}
			<i class="fa-solid text-2xl fa-compact-disc text-pulse-accent"></i>
		{/if}
	{:else}
		<i class="fa-solid text-2xl
			{filter === 'audio' ? 'fa-music text-blue-400' : 
			filter === 'video' ? 'fa-film text-purple-400' : 
			'fa-icons text-pulse-accent'}"></i>
	{/if}
</div>

<div class="area-title flex items-end pb-1 min-w-0">
	<h2 class="font-display italic text-2xl font-black truncate leading-tight">
		{track.title}
	</h2>
</div>

<div class="area-desc flex items-start min-w-0 mt-1">
	<p class="text-[10px] text-pulse-accent uppercase tracking-widest font-bold opacity-80 truncate">
		{formatDescription(track)}
	</p>
</div>

<style>

.area-icon { grid-area: icon; }
.area-title { grid-area: title; }
.area-desc { grid-area: desc; }

</style>