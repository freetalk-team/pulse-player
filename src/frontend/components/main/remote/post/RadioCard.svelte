<script>

import { formatLocationHtml } from '../../../../utils/region';
import { playRadio } from '../../../../stores/play';

export let item;

</script>

<div class="flex gap-8">
    <div class="h-32 w-32 bg-black/40 rounded-2xl">
        {#if item.favicon}
            <img
                src={platform.resolve(item.favicon)}
                alt=""
                class="h-full w-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
            />
        {:else}
            <div class="w-full h-full flex items-center justify-center text-gray-800 rounded-2xl">
                <i class="fa-solid fa-radio text-4xl"></i>
            </div>
        {/if}
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-center">

        <h3 class="mt-2 truncate text-2xl font-bold text-pulse-white">
            {item.name}
        </h3>
        <p class="text-xs uppercase tracking-wider text-gray-500">
            {@html formatLocationHtml(item)} 
        </p>
        <p class="mt-2 text-pulse-accent uppercase line-clamp-2">
            {item.tags}
        </p>
        
        <div class="mt-5 flex gap-3">

            <button
                class="rounded-2xl bg-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
                on:click={() => playRadio(item)}
            >
                <i class="fa-solid fa-play mr-2"></i>
                Play
            </button>
        </div>
    </div>
</div>

