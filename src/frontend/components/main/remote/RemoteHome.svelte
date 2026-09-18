<script>

import { onMount } from "svelte";

import { controller, isLoading, fetch, setRemote } from "../../../stores/remote/posts";
import { currentRemote } from "../../../stores/remote";

import PostCard from "./PostCard.svelte";
import Recent from "./Recent.svelte";
import LoadSentinel from "../LoadSentinel.svelte";

export let onDownload;

const store = controller.store;

onMount(() =>  currentRemote.subscribe(remote => setRemote(remote)));

</script>

<div class="flex-1 auto-hide-scrollbar:hover min-w-0">
	<div class="mx-auto flex min-w-0 max-w-6xl gap-8 p-8">

		<div class="min-w-0 flex-1 flex flex-col gap-6">

			{#each $store?.posts ?? [] as post (post.id)}
				<PostCard {controller} {post} {onDownload} />
			{/each}

			<LoadSentinel isLoading={$isLoading} hasMore={$store.hasMore} {fetch} />
		</div>

		<!-- RIGHT SIDEBAR -->
		<div class="hidden w-80 shrink-0 xl:block">

			<div class="sticky top-8 space-y-6">
				<Recent isRemote={true}/>
			</div>
		</div>
	</div>
</div>
