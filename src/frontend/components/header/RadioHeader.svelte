<script>

import { regionInfo } from '../../utils/region';
import { formatTags } from '../../utils/format';

export let station;

function formatDescription(station) {

    const region = station.countrycode ? regionInfo[station.countrycode] : { flag: '<i class="fa-solid fa-flag"></i>', name: 'Not specified' };

    const flag = `<span>${region.flag}</span>`;
    const state = `<strong class="tracking-wider font-bold uppercase">${station.state || region.name}</strong>`;
    const tags = `<span class="uppercase text-pulse-accent tracking-wider truncate font-bold">${formatTags(station.tags || 'various')}</span>`;

    return `<span class="flex items-center gap-2">${flag}${state}${tags}</span>`;
}
	
</script>

<div class="area-icon flex items-center justify-center overflow-hidden rounded-lg shadow-lg bg-black/40 w-14 h-14 border border-white/5">
    {#if station.favicon}
        <img src="{platform.resolve(station.favicon)}" class="w-full h-full object-cover" alt="" />
    {:else}
        <i class="fa-solid text-2xl fa-red-400 fa-radio"></i>
    {/if}
</div>

<div class="area-title flex items-end pb-1 min-w-0">
	<h2 class="font-display italic text-2xl font-black truncate leading-tight">
		{station.name}
	</h2>
</div>

<div class="area-desc flex items-start min-w-0 mt-1">
	<p class="text-[10px] opacity-80 truncate">
		{@html formatDescription(station)}
	</p>
</div>

<style>

.area-icon { grid-area: icon; }
.area-title { grid-area: title; }
.area-desc { grid-area: desc; }

</style>