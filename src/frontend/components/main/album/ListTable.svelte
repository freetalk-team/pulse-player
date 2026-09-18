<script>

import { onMount } from 'svelte';

import { formatDuration } from '../../../utils/format';

import { playTrack } from '../../../stores/play';
import { tracks, isLoading, loadTracks } from '../../../stores/albums';
import { selectedAlbum } from '../../../stores/player';

import Loading from '../Loading.svelte';

onMount(() => selectedAlbum.subscribe(v => {
	if (v)
		loadTracks(v.id);
}));


</script>

{#if $isLoading}
	<div class="mt-10">
		<Loading />
	</div>
{:else}

	<table class="w-full text-left border-separate border-spacing-y-1 mb-4">
		<thead class="text-gray-500 text-[10px] uppercase tracking-widest">
			<tr>
			<th class="w-10 pl-4">#</th>
			<th>Title</th>
			<th class="w-20 text-right pr-4"><i class="fa-regular fa-clock"></i></th>
			</tr>
		</thead>
		<tbody>
			<!-- {#each $currentTracks as track (track.id)} -->
			{#each $tracks as track, i}
				<tr class="group rounded-md hover:bg-pulse-white/5 transition-colors cursor-pointer text-sm"
					onclick={() => playTrack(track)}
				>
					<td class="py-3 pl-4 text-gray-500 group-hover:text-pulse-accent">
					{track.track_no || i + 1}
					</td>
					<td class="py-3">
					<div class="font-medium text-gray-200">{track.title}</div>
					</td>
					<td class="py-3 pr-4 text-right text-gray-500 font-mono text-xs">
					{formatDuration(track.duration)}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}