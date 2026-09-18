<script>

import { fade } from 'svelte/transition';

import Input from './Input.svelte';
import Comment from './Comment.svelte';

export let controller;
export let comments = [];
export let onComment = () => {}

</script>

<div in:fade>

	<!-- Add comment -->
	<div class="p-4">
		<Input onSubmit={onComment} />
	</div>

	<!-- Comment list -->
	<div class="divide-y divide-zinc-900">

		{#if comments.length === 0}

			<div class="p-4 text-sm text-zinc-500">
				No comments yet
			</div>

		{:else}

			{#each comments as comment (comment.id)}
				<Comment {controller} {comment} {onComment} />
			{/each}
		{/if}
	</div>
</div>