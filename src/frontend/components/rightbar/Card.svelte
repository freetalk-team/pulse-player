<script>

import { tooltip } from "../../actions";
import { sleep } from "../../utils/sleep";

import { editTrack, updateTrack } from "../../stores/tracks";

import Loading from "../main/Loading.svelte";

export let track;

let loading = false;

async function update() {

	loading = true;

	await Promise.all([
		updateTrack(track, true, false),
		sleep(600)
	]);

	loading = false;
}


</script>

{#if loading}

<div class="py-6">
	<Loading text={"Updating"} />
</div>

{:else}

<div class="mb-8 mt-4 group pl-2">
	<div class="flex items-center mb-4">
		<h3 class="flex-grow text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] truncate">Now Playing</h3>

		{#if !platform.remote}
			<div class="flex items-center gap-2">
				{#if track.artist}
					<button 
						aria-label="Quick fetch"
						on:click={update}
						use:tooltip={"Quick Fetch"}
						class="flex items-center justify-center bg-white/5 hover:bg-pulse-accent/20 text-gray-400 hover:text-pulse-accent rounded-full transition-all"
					>
						<i class="fa-solid fa-bolt text-xs"></i>
					</button>
				{/if}
				<button 
					aria-label="Edit"
					on:click={() => editTrack.set(track)}
					use:tooltip={"Edit"}
					class="flex items-center justify-center bg-white/5 hover:bg-orange-500/20 text-gray-400 hover:text-orange-500 rounded-full transition-all"
				>
					<i class="fa-solid fa-pen-to-square text-xs"></i>
				</button>
			</div>
		{/if}
	</div>
	<!-- {#if !track.album || track.album === 'Unknown Album'}
		<div class="absolute top-2 right-2 bg-yellow-500/20 text-yellow-500 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold backdrop-blur-md border border-yellow-500/20">
			Generic Tags
		</div>
	{/if} -->
	{#if track.thumb_path}
		<div class="relative aspect-square rounded-xl overflow-hidden shadow-2xl mb-4 border border-white/10">
			<img 
				src="{platform.resolve(track.thumb_path)}" 
				class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
				alt="" 
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
		</div>
	{/if}
	<h4 class="text-lg font-bold text-white leading-tight">{track.title}</h4>
	<p class="text-sm text-gray-400">{track.artist}</p>
	{#if track.genre}
		<span class="text-[9px] text-pulse-accent/70 uppercase tracking-tighter">
			{track.genre}
		</span>
	{/if}
</div>

{/if}
