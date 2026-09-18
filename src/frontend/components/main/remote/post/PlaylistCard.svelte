<script>

import { playSet } from '../../../../stores/play';
import { playlists } from '../../../../stores/remote/downloads';

import Previews from "../../Previews.svelte";
import Progress from '../../../ui/Progress.svelte';

export let item;
export let onDownload;

const downloadId = `${item.remote}_${item.id}`;

$: activeDownload = $playlists[downloadId]; 

function handleDownload() {
    onDownload?.('playlist', item);
}

</script>

<div class="flex gap-8">
	<div class="h-32 w-32 bg-black/40 rounded-2xl">

		<div class="aspect-square grid grid-cols-2 grid-rows-2 gap-1 rounded-xl bg-black/40 shadow-inner overflow-hidden">
			<Previews {item} />
		</div>
		
	</div>

	<div class="flex min-w-0 flex-1 flex-col justify-center">

		<div class="text-xs uppercase tracking-wider text-pulse-accent">
			{item.track_count} tracks
		</div>

		<h3 class="mt-2 truncate text-2xl font-bold text-pulse-white">
			{item.name}
		</h3>

		<div class="mt-2 text-zinc-400">
			{item.genre}
		</div>

		<div class="mt-5 flex gap-3">

			<button
				class="rounded-2xl bg-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
				on:click={() => playSet(item)}
			>
				<i class="fa-solid fa-play mr-2"></i>
				Play
			</button>

			{#if onDownload}
                {#if activeDownload}
                    <div class="flex-1 flex items-center gap-2">
                        <Progress value={activeDownload.progress} />
                        <span class="text-indigo-400 font-bold text-xs">{activeDownload.progress}%</span>
                    </div>
                {:else}
                    <button
                        class="rounded-2xl bg-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
                        on:click={handleDownload}
                    >
                        <i class="fa-solid fa-cloud-arrow-down mr-2"></i>
                        Download
                    </button>
                {/if}
            {/if}
		   
		</div>
	</div>
</div>

