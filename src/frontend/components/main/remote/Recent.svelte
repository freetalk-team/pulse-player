<script>

import { onMount } from "svelte";
import { fade } from "svelte/transition";

import { currentRemote } from "../../../stores/remote";

import RecentItem from "./RecentItem.svelte";

export let isRemote = false;

let items = [];

onMount(() => currentRemote.subscribe(async remote => {
	if (!isRemote ^ !remote) return;
	items = await api.queryCollections('sets', { sort: 'rating', offset: 0, limit: 5 }, remote?.id);
	console.debug('Remote recent:', items);
}));



</script>


<div in:fade class="rounded-3xl border border-pulse-white/5 bg-pulse-white/[0.03] p-4 backdrop-blur-xl">

	<h3 class="mb-4 text-lg font-semibold">
		Top
	</h3>

	<div class="space-y-4">
		{#each items as item}
			<RecentItem {item} />
		{/each}
	</div>
</div>