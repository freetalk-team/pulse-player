<script>

import { scrollHover } from '../../../actions';

import EmojiPicker from '../EmojiPicker.svelte';

export let placeholder = 'Write a comment...';
export let onSubmit = () => {};

let content = '';
let showEmoji = false;
let emojiButton;

function submit() {

	const text = content.trim();

	if (!text) {
		return;
	}

	onSubmit(text);

	content = '';
}

function addEmoji(event) {
	content += event.detail;
	showEmoji = false;
}

</script>

<div class="flex gap-3">

	<div class="relative flex-grow flex">

		<textarea
			bind:value={content}
			use:scrollHover
			rows="2"
			placeholder={placeholder}
			class="custom-scroll overflow-y-auto flex-1 resize-none rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-zinc-500"
		/>
		

		<button
			class="absolute bottom-1 right-1"
			bind:this={emojiButton}
			on:click={() => showEmoji = !showEmoji}
		>
			😊
		</button>

		{#if showEmoji}

			<EmojiPicker
				anchor={emojiButton}
				bind:show={showEmoji}
				on:select={addEmoji}
			/>
		{/if}
	</div>

	<button class="self-end icon-text-button bg-violet-500 shadow-violet-500/20 hover:bg-violet-400"
		on:click={submit}
	>
		<i class="fa-solid fa-paper-plane text-[9px]"></i>
		Post
	</button>
	<!-- <button
		on:click={submitComment}
		class="self-end px-4 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition"
	>
		Post
	</button> -->

</div>