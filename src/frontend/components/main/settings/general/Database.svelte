<script>

import { onMount } from "svelte";

import { formatSize } from "../../../../utils/format";
import { clearLibrary } from "../../../../stores/library";

let databases;

onMount(() => {
	databases = Object.entries(api.getPref('db'))
		.map(([name, info]) => ({ name, ...info }));
});
	
</script>

<section class="panel">
	<h3 class="head">
		<i class="fa-solid fa-database mr-2"></i>
		Database
	</h3>

	<div class="my-2 p-3">
		{#each databases as db}
			<div class="flex flex-grow p-2 items-center gap-4 rounded text-sm text-gray-400 even:bg-pulse-white/5">
				<span class="flex-1">
					{db.name.capitalizeFirstLetter()}
				</span>
				<b class="text-xs">{formatSize(db.size)}</b>
				<i>ver. {db.version}</i>
			</div>
		{/each}
	</div>

	<div class="flex flex-grow my-3 p-3 items-center">

		<i class="text-sm flex-1 text-gray-400">Delete tracks, albums and playlist</i>

		<button 
			on:click={clearLibrary}
			class="ml-audo flex items-center gap-2 px-4 py-1 bg-red-400 text-black rounded-full font-bold hover:scale-105 transition-transform"
		>
			<i class="fa-solid fa-xmark text-[12px]"></i>
			<span class="text-sm">Delete library</span>
		</button>
	</div>
</section>