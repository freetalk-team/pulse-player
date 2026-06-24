<script>

import { fade } from "svelte/transition";

import { sleep } from "../../utils/sleep";
import { editTrack, updateTrack } from "../../stores/tracks";

import ToggleOption from "./ToggleOption.svelte";
import GenreSelect from "../ui/GenreSelect.svelte";
import Loading from "../main/Loading.svelte";

export let track;

let fetchMeta = true;
let updateFile = true;
let loading = false;

async function update() {

	loading = true;

	await Promise.all([
		updateTrack(track, fetchMeta, updateFile),
		sleep(600)
	]);

	loading = false;
}

function getFilename(path) {
	const index = path.lastIndexOf('/') + 1;
	return path.substr(index);
}

</script>

{#if loading}

<div class="py-6">
	<Loading text={"Updating"} />
</div>

{:else}

<div class="my-4 group pl-2 flex flex-col gap-3" in:fade>
	<div class="flex items-center mb-4">
		<h3 class="flex-grow text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Edit</h3>
		<button 
			on:click={() => editTrack.set(null)}
			class="px-3 py-1 bg-white/5 hover:bg-pulse-accent hover:text-black rounded text-[10px] font-bold transition-all truncate tracking-wider"
		>
			FINISH EDITING
		</button>
	</div>
	
	{#if track.thumb_path}
		<div class="thumb">
			<img 
				src="{platform.resolve(track.thumb_path)}" 
				alt="" 
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
		</div>
	{/if}
	<div class="flex flex-col gap-2">
		<label class="text-[9px] text-gray-500 uppercase">Filename</label>
		<input
			value={getFilename(track.path)}
			class="input"
			readonly
		/>
	</div>
	<div class="flex flex-col gap-2">
		<label class="text-[9px] text-gray-500 uppercase">Title</label>
		<input 
			bind:value={track.title}
			class="input"
			placeholder="Title..."
			spellcheck="false"
		/>
	</div>
	<div class="flex flex-col gap-2">
		<label class="text-[9px] text-gray-500 uppercase">Artist</label>
		<input 
			bind:value={track.artist}
			class="input"
			placeholder="Artist..."
			spellcheck="false"
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label class="text-[9px] text-gray-500 uppercase">Genre</label>
		<GenreSelect 
			bind:value={track.genre} 
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label class="text-[9px] text-gray-500 uppercase">Tag</label>
		<input 
			bind:value={track.tag}
			class="input"
			placeholder="Tag..."
			spellcheck="false"
		/>
	</div>

	<div class="flex flex-col gap-2">
		<ToggleOption title={"Fetch meta"} bind:enabled={fetchMeta} />
		<ToggleOption title={"Update file meta"} bind:enabled={updateFile} />
		<button 
			on:click={update}
			class="self-start mt-3 icon-text-button pulse text-[12px]"
		>
			<i class="fa-solid fa-floppy-disk"></i>
			Update
		</button>
	</div>
</div>

{/if}

<style>

@reference "../../assets/main.css";

.input {
	@apply bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-gray-700 w-full truncate focus:text-pulse-accent transition-colors;
}

.thumb {
	@apply relative aspect-square rounded-xl overflow-hidden shadow-2xl mb-4 border border-white/10;
}

.thumb > img {
	@apply w-full h-full object-cover transition-transform duration-700 group-hover:scale-105;
}

</style>