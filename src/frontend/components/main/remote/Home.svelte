<script>

import { onMount } from "svelte";
import { fade } from "svelte/transition";

import { sleep } from "../../../utils/sleep";
import { scrollHover } from "../../../actions";

import { loadPosts, posts, hasMore, isLoading, addPost } from "../../../stores/remote";

import PostInput from "./PostInput.svelte";
import PostCard from "./PostCard.svelte";
import Recent from "./Recent.svelte";
import Donate from "./Donate.svelte";
// import Session from "./Session.svelte";
// import Users from "./Users.svelte";

import LoadSentinel from "../LoadSentinel.svelte";

let hostname;
let username;

onMount(() => {
	hostname = api.getPref('instanceName');
	username = api.getPref('username');
});


async function handleDelete(post) {

	// await api.deletePost(post);

	// posts = posts.filter(i => i.id != post.id);
}

</script>

<div class="flex h-full flex-col overflow-hidden min-w-0">

	<div class="flex items-center gap-4 rounded-xl p-4 m-4 bg-pulse-white/5">
		<i class="fa-solid fa-home text-violet-500 text-3xl"></i>
		<div class="flex-grow flex flex-col">
			<h2 class="text-pulse-white/80 font-black tracking-wider text-xl">
				{hostname}
			</h2>
			<i class="text-sm text-gray-600">{username}</i>
		</div>
		
	</div>

	<div class="flex-1 overflow-y-auto custom-scroll min-w-0"
		use:scrollHover
	>

		<div class="mx-auto flex min-w-0 max-w-6xl gap-8 p-8">

			<div class="min-w-0 flex-1 flex flex-col gap-6">

				<PostInput placeholder={"What's on your mind?"} onSubmit={addPost} />

				{#each $posts as post (post.id)}
					<PostCard {post} onDelete={handleDelete} />
				{/each}

				<LoadSentinel isLoading={$isLoading} hasMore={$hasMore} fetch={loadPosts} />
			</div>

			<!-- RIGHT SIDEBAR -->
			<div class="hidden w-80 shrink-0 xl:block">

				<div class="sticky top-8 space-y-6">
					<Recent />
					<Donate />
					<!-- <Users /> -->
					<!-- <Session /> -->
				</div>
			</div>
		</div>

	</div>

</div>

