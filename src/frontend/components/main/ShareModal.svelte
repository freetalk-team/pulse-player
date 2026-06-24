<script>

import { scrollHover } from '../../actions';

import { share, createPost } from '../../stores/share';

import EmojiPicker from './EmojiPicker.svelte';

let description = '';
let showEmoji = false;
let emojiButton;

function close() {
	share.set(null);
	description = '';
}

function handleShare() {
	createPost(description.trim());
	description = '';
}

function addEmoji(event) {
	description += event.detail;
	showEmoji = false;
}
	
</script>

{#if $share}

	<div
		class="fixed inset-0 z-60 flex items-center justify-center bg-pulse-black/70 p-6 backdrop-blur-md"
		on:click={close}
	>

		<!-- MODAL -->

		<div
			class="w-full max-w-2xl overflow-hidden rounded-[32px] border border-pulse-white/10 bg-pulse-black shadow-2xl shadow-pulse-black/50"
			on:click|stopPropagation
		>

			<!-- HEADER -->
			<div class="flex items-center justify-between border-b border-pulse-white/5 px-6 py-5">
				<div>
					<div class="text-xs uppercase tracking-[0.2em] text-violet-400">
						Share
					</div>

					<h2 class="mt-1 text-2xl font-bold text-pulse-white">
						{$share.type === 'track' ? 'Share Track' : 'Share Playlist'}
					</h2>
				</div>

				<button
					class="flex h-10 w-10 items-center justify-center rounded-2xl bg-pulse-white/5 text-gray-400 transition hover:bg-pulse-white/10 hover:text-pulse-white"
					on:click={close}
				>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>

			<!-- BODY -->
			<div class="space-y-6 p-6">

				<!-- PREVIEW CARD -->
				<div class="overflow-hidden rounded-3xl border border-pulse-white/5 bg-pulse-white/[0.03]">

					<div class="flex gap-5 p-5">

						<div class="h-32 w-32 bg-black/40 rounded-2xl">
							{#if $share.item.thumb_path}

								<img
									src={platform.resolve($share.item.thumb_path)}
									alt=""
									class="h-full w-full object-cover rounded-2xl"
								/>
							{:else}
								<div class="w-full h-full flex items-center justify-center text-gray-800 rounded-2xl">
									<i class="fa-solid fa-music text-4xl"></i>
								</div>
							{/if}
						</div>

						<div class="flex min-w-0 flex-1 flex-col justify-center">

							<div class="text-xs uppercase tracking-wider text-violet-400">
								{$share.type == 'track' || $share.type == 'album' ? $share.item.artist || 'Unknown' : `${$share.item.track_count} tracks`}
							</div>

							<h3 class="mt-2 truncate text-2xl font-bold text-pulse-white">
								{$share.item.title || $share.item.name}
							</h3>

							<div class="mt-2 text-zinc-400">
								{$share.item.genre}
							</div>

							<div class="mt-5 flex gap-3">

								<button class="rounded-2xl bg-violet-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400">
									<i class="fa-solid fa-play mr-2"></i>
									Play
								</button>

								<button class="rounded-2xl bg-white/5 px-5 py-2 text-sm text-zinc-300 transition hover:bg-white/10">
									<i class="fa-regular fa-heart mr-2"></i>
									Like
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- DESCRIPTION -->

				<div>

					<label class="mb-3 block text-sm font-medium text-gray-300">
						Add description
					</label>

					<!-- <textarea
						bind:value={description}
						rows="5"
						placeholder="Share your thoughts, recommendations or mood..."
						class="w-full resize-none rounded-3xl border border-white/5 bg-black/20 px-5 py-4 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-violet-500"
					></textarea> -->

					<div class="relative">

						<textarea
							bind:value={description}
							use:scrollHover
							rows="5"
							placeholder="Share your thoughts, recommendations or mood..."
							class="custom-scroll overflow-y-auto w-full resize-none rounded-xl border border-pulse-white/5 bg-pulse-black/20 px-5 py-4 text-pulse-white outline-none transition placeholder:text-gray-400 focus:border-violet-500"
						></textarea>

						<button
							class="absolute bottom-3 right-3"
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

					<div class="mt-3 flex items-center justify-between">

						<div class="text-sm text-gray-500">
							Visible to LAN users
						</div>

						<div class="text-sm text-gray-500">
							{description.length}/500
						</div>
					</div>
				</div>
			</div>

			<!-- FOOTER -->

			<div class="flex items-center justify-end gap-3 border-t border-white/5 px-6 py-5">

				<button
					class="rounded-2xl bg-pulse-white/5 px-5 py-3 text-sm text-gray-300 transition hover:bg-pulse-white/10"
					on:click={close}
				>
					Cancel
				</button>

				<button
					class="rounded-2xl bg-violet-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
					on:click={handleShare}
				>
					<i class="fa-solid fa-paper-plane mr-2"></i>
					Share Post
				</button>
			</div>
		</div>
	</div>

{/if}