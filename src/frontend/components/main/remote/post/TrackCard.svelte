<script>

import { playTrack } from '../../../../stores/play';
import { tracks } from '../../../../stores/remote/downloads';

import Progress from '../../../ui/Progress.svelte';

export let item;
export let onDownload;

const downloadId = `${item.remote}_${item.id}`;

$: activeDownload = $tracks[downloadId]; 

function handleDownload() {
    onDownload?.('track', item);
}


</script>

<div class="flex gap-8">
    <div class="h-32 w-32 bg-black/40 rounded-2xl">
        {#if item.thumb_path}
            <img
                src={platform.resolve(item.thumb_path)}
                alt=""
                class="h-full w-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
            />
        {:else}
            <div class="w-full h-full flex items-center justify-center text-gray-800 rounded-2xl">
                <i class="fa-solid fa-music text-4xl"></i>
            </div>
        {/if}
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-center">

        <div class="text-xs uppercase tracking-wider text-pulse-accent">
            {item.artist}
        </div>

        <h3 class="mt-2 truncate text-2xl font-bold text-pulse-white">
            {item.title}
        </h3>

        <div class="mt-2 text-zinc-400">
            {item.genre}
        </div>

        <div class="mt-5 flex gap-3">

            <button
                class="rounded-2xl bg-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
                on:click={() => playTrack(item)}
            >
                <i class="fa-solid fa-play mr-2"></i>
                Play
            </button>

            {#if onDownload}
                {#if activeDownload}
                    <div class="flex-1 flex items-center gap-2">
                        <Progress value={30} />
                        <span class="text-indigo-400 text-sm">30%</span>
                    </div>
                {:else}
                    <button
                        class="rounded-2xl bg-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
                        on:click={handleDownload()}
                    >
                        <i class="fa-solid fa-cloud-arrow-down mr-2"></i>
                        Download
                    </button>
                {/if}
            {/if}
           
        </div>
    </div>
</div>

