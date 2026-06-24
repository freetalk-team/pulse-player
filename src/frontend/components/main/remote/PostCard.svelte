<script>

import { fade } from 'svelte/transition';

import { tooltip } from '../../../actions';
import { markdown } from '../../../utils/md';
import { formatPostTime } from '../../../utils/time';

import { playTrack } from "../../../stores/play";
import { playPlaylist } from "../../../stores/playlist";
import { playAlbum } from "../../../stores/library";
import { loadComments, addComment, comments } from '../../../stores/remote';
import { now } from "../../../stores/now";

import Comments from './Comments.svelte';

export let post;
export let onDelete = () => {};
export let remote = false;

$: formattedTime = formatPostTime(post.created_at, $now);

let showComments = false;

function handlePlay() {

	switch (post.type) {

		case 'track':
		playTrack(post.item);
		break;

		case 'playlist':
		playPlaylist(post.item);
		break;

		case 'album':
		playAlbum(post.item);
		break;

	}

}

async function handleAddComment(content, parentId) {
	
	const res = await addComment(content, post.id, parentId);

	// if (!res) // added to remote
	// 	return;

	// const { id, username, created_at } = res;

	// if (parentId) {
	// 	const comment = comments.find(i => i.id == parentId);

	// 	if (comment) {

	// 		if (!comment.replies)
	// 			comment.replies = [];

	// 		comment.replies.push({
	// 			id,
	// 			content,
	// 			username,
	// 			created_at
	// 		});

	// 		comments = [...comments];
	// 	}
	// }
	// else {
	// 	const comment = {
	// 		id,
	// 		content,
	// 		username,
	// 		created_at
	// 	}

	// 	comments = [...comments, comment];
	// 	commentCount = commentCount + 1;		
	// }
}

function toggleLike() {
	// reaction logic
}

async function toggleComments() {
	await loadComments(post.id);
	showComments = !showComments;
}

</script>

<div in:fade={{duration: 800}} class="group min-w-0 px-5 py-2 flex flex-col space-y-6 rounded-xl bg-black/20 border-1 border-pulse-white/10 backdrop-blur">
	<div class="flex items-center border-b-1 border-gray-600/20 gap-4">
		<h2 class="flex-grow p-1 uppercase text-gray-500 font-semibold tracking-wider">{post.type}</h2>
		{#if !remote}
			<button 
				class="opacity-0 group-hover:opacity-100 transition-all w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500"
				use:tooltip={"Delete"}
				on:click={() => onDelete(post)}
			>
				<i class="fa-solid fa-trash-can text-xs"></i>
			</button>
		{/if}
		<div class="text-xs text-zinc-500">
			{formattedTime}
		</div>
	</div>
	{#if post.item}
		<div class="flex gap-8">
			<div class="h-32 w-32 bg-black/40 rounded-2xl">
				{#if post.item.thumb_path}

					<img
						src={platform.resolve(post.item.thumb_path)}
						alt=""
						class="h-full w-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
					/>
				{:else}
					<div class="w-full h-full flex items-center justify-center text-gray-800 rounded-2xl">
						<i class="fa-solid fa-music text-4xl"></i>
					</div>
				{/if}
			</div>

			<div class="flex min-w-0 flex-1 flex-col justify-center">

				<div class="text-xs uppercase tracking-wider text-pulse-accent">
					{post.type == 'track' || post.type == 'album' ? post.item.artist || 'Unknown' : `${post.item.track_count} tracks`}
				</div>

				<h3 class="mt-2 truncate text-2xl font-bold text-pulse-white">
					{post.item.title || post.item.name}
				</h3>

				<div class="mt-2 text-zinc-400">
					{post.item.genre}
				</div>

				<div class="mt-5 flex gap-3">

					<button
						class="rounded-2xl bg-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
						on:click={handlePlay}
					>
						<i class="fa-solid fa-play mr-2"></i>
						Play
					</button>

					<!-- <button class="rounded-2xl bg-white/5 px-5 py-2 text-sm text-zinc-300 transition hover:bg-white/10">
						<i class="fa-regular fa-heart mr-2"></i>
						Like
					</button> -->
				</div>
			</div>
		</div>
	{/if}

	<div class="prose prose-invert max-w-none">
		{@html markdown(post.content)}
	</div>

	<!-- Footer -->
	<div class="flex flex-col px-4 py-3 border-t border-zinc-800">

		<div class="flex items-center gap-4">

			<button
				class="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
				on:click={toggleLike}
			>
				<i class="fa-solid fa-heart"></i>
				<span>{post.reaction_count || 0}</span>
			</button>

			<button
				class="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
				on:click={toggleComments}
			>
				<i class="fa-regular fa-comment"></i>
				<span>{post.comments_count}</span>
			</button>

		</div>

		{#if showComments}

			<Comments
				comments={$comments[post.id]}
				onComment={handleAddComment}
			/>

		{/if}
		
	</div>
</div>