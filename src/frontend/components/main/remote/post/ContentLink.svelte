<script>

import Link from "../../../ui/Link.svelte";

export let metadata;

</script>

<Link url={metadata.url}>

	<div slot="content" class="link-card bg-zinc-800/30 rounded-xl overflow-hidden border border-zinc-700 hover:border-zinc-600 transition-colors">
		{#if metadata.image}
			<div class="relative w-full h-48 bg-zinc-900">
				<img
					src={metadata.image}
					alt={metadata.title}
					class="w-full h-full object-cover"
					on:error={(e) => (e.target.style.display = 'none')}
				/>
			</div>
		{/if}
		
		<div class="p-3">
		<div class="flex items-start gap-2">
			<div class="flex-1 min-w-0">
			{#if metadata.title}
				<h3 class="text-sm font-medium text-white line-clamp-2">
				{metadata.title}
				</h3>
			{/if}
			
			{#if metadata.description}
				<p class="text-xs text-zinc-400 line-clamp-2 mt-1">
				{metadata.description}
				</p>
			{/if}
			
			<div class="flex items-center gap-2 mt-2">
				{#if metadata.favicon}
				<img
					src={metadata.favicon}
					alt=""
					class="w-4 h-4 rounded"
					on:error={(e) => (e.target.style.display = 'none')}
				/>
				{/if}
				<span class="text-xs text-zinc-500 truncate">
				{metadata.siteName}
				</span>
			</div>
			</div>

		
		</div>
		</div>
	</div>

</Link>

