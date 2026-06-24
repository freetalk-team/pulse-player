<script>

import { fade } from "svelte/transition";

import { scrollHover } from "../../../actions";

import EmojiPicker from "../EmojiPicker.svelte";
import Reply from "./Reply.svelte";

export let parentId;
export let replies = [];
export let showReply;
export let onReply = () => {};

let content = '';
let showEmoji = false;
let emojiButton;

function submitReply() {

	const text = content.trim();

	if (!text) {
		return;
	}

	onReply(text, parentId);

	showReply = false;
	content = '';
}

function addEmoji(event) {
	content += event.detail;
	showEmoji = false;
}
	
</script>

<div class="mt-4 ml-4 border-l border-zinc-800 pl-4 space-y-4">

	{#if showReply}
		<div in:fade class="p-4">
			<div class="flex gap-3">
				<div class="relative flex-grow flex">

					<textarea
						bind:value={content}
						use:scrollHover
						rows="1"
						placeholder="Write a reply..."
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

				<button class="h-8 self-end icon-text-button bg-violet-500 shadow-violet-500/20 hover:bg-violet-400"
					on:click={submitReply}
				>
					<i class="fa-solid fa-paper-plane text-[9px]"></i>
				</button>
				<!-- <button
					on:click={submitComment}
					class="self-end px-4 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-white transition"
				>
					Post
				</button> -->

			</div>
		</div>
	{/if}

	{#each replies as reply (reply.id)}
		<Reply {reply} />
	{/each}
</div>

