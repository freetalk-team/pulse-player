<script>

import { fade } from 'svelte/transition';

import { tooltip } from '../../../actions';
import { formatPostTime } from '../../../utils/time';

import { now } from "../../../stores/now";

import Comments from './post/Comments.svelte';
import Content from './post/Content.svelte';
import ContentLink from './post/ContentLink.svelte';

export let controller;
export let post;
export let onDownload;

$: formattedTime = formatPostTime(post.created_at, $now);

let showComments = false;


function handleDelete() {
	controller.deletePost(post);
}

async function handleAddComment(content, parentId, parentUser) {

	const comment = {
		content,
		post_id: post.id,
		comment_id: parentId,
		parent_uid: parentUser
	};
	
	await controller.addComment(comment);
}

async function toggleLike() {
	if (post.reaction || controller.isMe(post.uid)) return;

	await controller.addReaction(post);
	// reaction logic
}

async function toggleComments() {
	await controller.loadComments(post.id);
	showComments = !showComments;
}

</script>

<div in:fade={{duration: 800}} class="group min-w-0 px-5 py-2 flex flex-col space-y-6 rounded-xl bg-black/20 border-1 border-pulse-white/10 backdrop-blur">
	<div class="flex items-center border-b-1 border-gray-600/20 gap-4">
		<h2 class="flex-grow p-1 uppercase text-gray-500 font-semibold tracking-wider">{post.type}</h2>
		{#if !onDownload}
			<button 
				class="opacity-0 group-hover:opacity-100 transition-all w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500"
				use:tooltip={"Delete"}
				on:click={handleDelete}
			>
				<i class="fa-solid fa-trash-can text-xs"></i>
			</button>
		{/if}
		<div class="text-xs text-zinc-500">
			{formattedTime}
		</div>
	</div>
	
	{#if post.type == 'link'}
		<ContentLink metadata={post.item} />
	{:else}
		<Content {post} {onDownload} />
	{/if}

	<!-- Footer -->
	<div class="flex flex-col px-4 py-3 border-t border-zinc-800">

		<div class="flex items-center gap-4">
			<button
				class="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
				on:click={toggleLike}
			>
				<i class="{post.reaction ? 'fa-solid text-blue-400' : 'fa-regular'} fa-thumbs-up"></i>
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
				{controller}
				comments={post.comments}
				onComment={handleAddComment}
			/>

		{/if}
		
	</div>
</div>