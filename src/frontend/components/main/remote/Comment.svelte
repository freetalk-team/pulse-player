<script>

import { formatPostTime } from '../../../utils/time';
import { markdown } from '../../../utils/md';

import { replies } from '../../../stores/remote';
import { now } from "../../../stores/now";

import Replies from './Replies.svelte';

export let comment;
export let onComment;

$: formattedTime = formatPostTime(comment.created_at, $now);

let showReply = false;

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
					class="text-xs text-zinc-500 hover:text-white"
					on:click={() => showReply = !showReply }
				>
					Reply
				</button>

				<button
					class="text-xs text-zinc-500 hover:text-white"
				>
					Like
				</button>

			</div>

			<!-- Replies -->
			<Replies 
				parentId={comment.id} 
				replies={$replies[comment.id]} 
				onReply={onComment} 
				bind:showReply={showReply} 
			/>
				
		</div>
	</div>
</div>