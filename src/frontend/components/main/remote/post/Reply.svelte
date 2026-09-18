<script>

import { markdown } from "../../../../utils/md";
import { formatPostTime } from "../../../../utils/time";

import { now } from "../../../../stores/now";

export let controller;
export let reply;

$: formattedTime = formatPostTime(reply.created_at, $now);

async function toggleLike() {
	if (reply.reaction || controller.isMe(reply.uid)) return;

	await controller.addReaction(null, reply);
}

</script>

<div>

	<div class="flex items-center gap-2 mb-1">

		<div class="font-medium text-sm text-gray-500">
			{reply.username}
		</div>

		<div class="text-xs text-zinc-500 ml-auto">
			{formattedTime}
		</div>

	</div>

	<div class="text-sm text-zinc-300 prose prose-invert">
		{@html markdown(reply.content)}
	</div>

	<button
		class="flex items-center mt-2 gap-2 text-sm text-zinc-400 hover:text-white transition"
		on:click={toggleLike}
	>
		<i class="{reply.reaction ? 'fa-solid text-blue-400' : 'fa-regular'} fa-thumbs-up"></i>
		<span>{reply.reaction_count || 0}</span>
	</button>
</div>