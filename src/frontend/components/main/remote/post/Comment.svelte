<script>



import { formatPostTime } from '../../../../utils/time';
import { markdown } from '../../../../utils/md';

import { now } from "../../../../stores/now";
import { canReply } from '../../../../stores/posts';

import Replies from './Replies.svelte';

export let controller;
export let comment;
export let onComment;

$: formattedTime = formatPostTime(comment.created_at, $now);

let showReply = false;

async function toggleReplies() {

	if (comment.replies_count > 0)	
		await controller.loadReplies(comment.post_id, comment.id);

	if (!showReply) {
		if (comment.replies_count > 0 || canReply(comment))
			showReply = true;

	} 
	else {
		showReply = false;
	}
}

async function toggleLike() {
	if (comment.reaction || controller.isMe(comment.uid)) return;

	await controller.addReaction(null, comment);
}


</script>

<div class="p-4">

	<div class="flex items-start gap-3">

		<!-- Avatar -->
		<div class="w-9 h-9 rounded-full bg-zinc-700 shrink-0 font-medium flex items-center justify-center">
			{comment.username[0]}
		</div>

		<div class="flex-1 min-w-0">

			<div class="flex items-center gap-2 mb-1">

				<div class="font-medium text-sm text-gray-500">
					{comment.username}
				</div>

				<div class="text-xs text-zinc-500 ml-auto">
					{formattedTime}
				</div>

			</div>

			<div class="text-sm prose prose-invert text-zinc-200">
				{@html markdown(comment.content)}
			</div>

			<div class="flex items-center gap-4 mt-2">

				<button
					class="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
					on:click={toggleLike}
				>
					<i class="{comment.reaction ? 'fa-solid text-blue-400' : 'fa-regular'} fa-thumbs-up"></i>
					<span>{comment.reaction_count || 0}</span>
				</button>

				<button
					class="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
					on:click={toggleReplies}
				>
					<i class="fa-regular fa-comment"></i>
					<span>{comment.replies_count || 0}</span>
				</button>
				

			</div>

			{#if showReply}
				<Replies 
					{controller}
					{comment} 
					onReply={onComment} 
				/>
			{/if}
		</div>
	</div>
</div>