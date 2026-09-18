<script>

export let item;


</script>

<div class="flex gap-5 p-5">
	<div class="h-32 w-32 bg-black/40 rounded-2xl">
		{#if item.cover_path}
			<img
				src={platform.resolve(item.cover_path)}
				alt=""
				class="h-full w-full object-cover rounded-2xl"
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center text-gray-800 rounded-2xl">
				<i class="fa-solid fa-compact-disc text-4xl"></i>
			</div>
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 flex-col justify-start">
		<h3 class="mb-2 truncate text-2xl font-bold text-pulse-white">
			{item.year ? `${item.name} (${item.year})` : item.name}
		</h3>
		<span class="uppercase tracking-wider text-violet-400">
			{item.artist}
		</span>
        <i class="text-xs uppercase tracking-wider text-gray-500">
			{item.track_count} tracks
		</i>
		<span class="mt-2 text-zinc-400">
			{item.genre}
		</span>
	</div>
</div>