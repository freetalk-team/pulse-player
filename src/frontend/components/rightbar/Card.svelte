<script>

import { tooltip } from "../../actions";
import { editTrack } from "../../stores/tracks";

let { track } = $props();

let thumbPath = $state(null);

if (__PLATFORM__ === 'web') {
	$effect(() => {
		const id = track?.cover;

		if (!id) {
			thumbPath = null;
			return;
		}

		let cancelled = false;

		platform.getThumb(id).then((url) => {
			if (cancelled) {
				if (url) {
					platform.releaseThumb(id);
				}
				return;
			}

			thumbPath = url;
		});

		return () => {
			cancelled = true;
			platform.releaseThumb(id);
			thumbPath = null;
		};
	});
} else {
	$effect(() => {
		thumbPath = track?.thumb_path ?? null;
	});
}

</script>

<div class="mb-8 mt-4 group pl-2">
	<div class="flex items-center mb-4">
		<h3 class="flex-grow text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] truncate">Now Playing</h3>

		{#if __PLATFORM__ === 'desktop' && !track.remote}
			<div class="flex items-center gap-2">
				
				<button 
					aria-label="Edit"
					onclick={() => editTrack.set(track)}
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
	{#if thumbPath}
		<div class="relative aspect-square rounded-xl overflow-hidden shadow-2xl mb-4 border border-white/10">
			<img 
				src="{platform.resolve(thumbPath)}" 
				class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
				alt="" 
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
		</div>
	{/if}
	<h4 class="text-lg font-bold text-white leading-tight line-clamp-3">{track.title}</h4>
	<p class="text-sm text-gray-400">{track.artist}</p>
	{#if track.genre}
		<span class="text-[9px] text-pulse-accent/70 uppercase tracking-tighter">
			{track.genre}
		</span>
	{/if}
</div>

