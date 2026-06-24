<script>

import { markdown } from "../../../utils/md";
import { formatPostTime } from "../../../utils/time";

import { now } from "../../../stores/now";

export let reply;

$: formattedTime = formatPostTime(reply.created_at, $now);

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

</div>