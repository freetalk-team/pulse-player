<script>

import { onMount } from "svelte";
import { fade } from "svelte/transition";

import RecentItem from "./RecentItem.svelte";

let items = [];

onMount(async () => {

	items = await api.getCollections('sets', { sort: 'recent', offset: 0, limit: 5 });
});

</script>


<div in:fade class="rounded-3xl border border-pulse-white/5 bg-pulse-white/[0.03] p-4 backdrop-blur-xl">

	<h3 class="mb-4 text-lg font-semibold">
		Recent
	</h3>

	<div class="space-y-4">
		{#each items as item}
			<RecentItem {item} />
		{/each}
	</div>
</div>