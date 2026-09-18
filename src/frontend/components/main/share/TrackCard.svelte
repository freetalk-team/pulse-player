<script>

export let item;

</script>

<div class="flex gap-5 p-5">
	<div class="h-32 w-32 bg-black/40 rounded-2xl">
		{#if item.thumb_path}
			<img
				src={platform.resolve(item.thumb_path)}
				alt=""
				class="h-full w-full object-cover rounded-2xl"
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center text-gray-800 rounded-2xl">
				<i class="fa-solid fa-music text-4xl"></i>
			</div>
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 flex-col justify-start">
		<h3 class="mb-2 truncate text-2xl font-bold text-pulse-white">
			{item.title}
		</h3>
		<span class="text-xs uppercase tracking-wider text-violet-400">
			{item.artist || 'Unknown'}
		</span>
		<span class="mt-2 text-zinc-400">
			{item.genre}
		</span>

		<!-- <div class="mt-5 flex gap-3">

			<button class="rounded-2xl bg-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400">
				<i class="fa-solid fa-play mr-2"></i>
				Play
			</button>

			<button class="rounded-2xl bg-white/5 px-5 py-2 text-sm text-zinc-300 transition hover:bg-white/10">
				<i class="fa-regular fa-heart mr-2"></i>
				Like
			</button>
		</div> -->
	</div>
</div>