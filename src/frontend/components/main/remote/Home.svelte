<script>

import { onMount } from "svelte";
import { fromStore } from "svelte/store";

import { scrollHover, tooltip } from "../../../actions";
import { sleep } from "../../../utils/sleep";
import { Colors } from "../../ui/icons";

import { controller, isLoading, fetch } from "../../../stores/posts";

import SlideView from '../SlideView.svelte';
import PostCard from "./PostCard.svelte";
import PostInput from "./post/Input.svelte";
import SkeletonCard from "./post/SkeletonCard.svelte";
import Recent from "./Recent.svelte";
import LoadSentinel from "../LoadSentinel.svelte";
import IconColor from "../../ui/controls/IconColor.svelte";
import IconPicker from "../../ui/controls/IconPicker.svelte";


let hostname;
let username;
let icon;
let iconColor;

let adding = false;
let showSettings = false;

const errors = {};
const store = controller.store;

onMount(() => {

	const remote = api.getPref('remote');

	hostname = remote.name;
	username = remote.username;
	[icon, iconColor] = remote.icon.split(' ');
});


async function handleAdd(content) {

	let type = 'post';
	let item;

	if (/^(https?:\/\/[^\s]+)$/.test(content)) {

		const url = URL.parse(content);

		if (url) {

			adding = true;

			const [meta] = await Promise.all([
				api.processLink(url.toString()),
				sleep(800)
			]);

			if (meta) {
				type = 'link';
				item = meta;
			}

			adding = false;
		}
	}

	controller.addPost(content, type, item);
}

async function onUpdate() {
	showSettings = false;

	const remote = {
		name: hostname,
		username,
		icon: `${icon} ${iconColor}`
	};

	await api.setPref('remote', remote);
}

function checkValid(e) {
	const input = e.target;

	if (input.value.length < 3)
		errors[input.name] = true;
	else
		errors[input.name] = false;
}

</script>

<SlideView selected={showSettings}>


<div slot="master" class="flex h-full flex-col overflow-hidden min-w-0">

	<div class="flex items-center gap-4 rounded-xl p-4 m-4 bg-pulse-white/5">
		<i class="fa-solid text-violet-500 text-3xl {icon}" style:color="{Colors[iconColor]}"></i>
		<div class="flex-grow flex flex-col">
			<h2 class="text-pulse-white/80 font-black tracking-wider text-xl">
				{hostname}
			</h2>
			<i class="text-sm text-gray-600">{username}</i>
		</div>
		<button class="text-2xl icon-button"
			use:tooltip={"Settings"}
			on:click={() => showSettings = true}
		>
			<i class="fa-solid fa-user-gear"></i>
		</button>
	</div>

	<div class="flex-1 overflow-y-auto custom-scroll min-w-0"
		use:scrollHover
	>
		<div class="mx-auto flex min-w-0 max-w-6xl gap-8 p-8">

			<div class="min-w-0 flex-1 flex flex-col gap-6">

				{#if adding}
					<SkeletonCard />
				{:else}
					<PostInput placeholder={"What's on your mind?"} onSubmit={handleAdd} />
				{/if}

				{#each $store?.posts ?? [] as post (post.id)}
					<PostCard {controller} {post} />
				{/each}

				<LoadSentinel isLoading={$isLoading} hasMore={$store.hasMore} {fetch} />
			</div>

			<!-- RIGHT SIDEBAR -->
			<div class="hidden w-80 shrink-0 xl:block">

				<div class="sticky top-8 space-y-6">
					<Recent />
					<!-- <Donate /> -->
					<!-- <Users /> -->
					<!-- <Session /> -->
				</div>
			</div>
		</div>

	</div>

</div>

<div slot="detail" class="flex h-full flex-col min-h-0 px-8">
	<div class="flex items-center justify-between py-8 border-b border-gray-500/30">
		<div class="text-gray-500 flex items-center gap-4 text-4xl">
			<i class="fa-solid fa-user-gear"></i>
			<h1 class="truncate font-black text-bold uppercase tracking-wider">Settings</h1>
		</div>
		<button class="bg-gray-700 font-black tracking-wider rounded-lg px-4 py-2
			hover:bg-blue-500
           	disabled:bg-gray-700
           	disabled:text-gray-500
           	disabled:opacity-50
           	disabled:cursor-not-allowed
           	disabled:hover:bg-gray-700"
			on:click={onUpdate}
			disabled={Object.values(errors).some(Boolean)}
		>
			Done
		</button>
	</div>

	<div class="max-w-4xl mx-auto w-full flex gap-6 flex-shrink-0 px-4 py-12">
		<div class="w-64 self-start aspect-square bg-black/40 rounded-2xl overflow-hidden border border-white/5">
			<!-- Use the 2x2 preview or a large icon here -->
			<div class="w-full h-full flex items-center justify-center">
				<i class="fa-solid text-8xl {icon}" style:color={Colors[iconColor]}></i>
			</div>
		</div>

		<div class="flex flex-col gap-6 w-full">
			<div class="flex flex-col gap-2">
				<label class="label">Hostname</label>
				<input bind:value={hostname} name="hostname" on:input={checkValid} spellcheck="false" class="input" class:error={errors['hostname']} />
			</div>

			<div class="flex flex-col gap-2">
				<label class="label">Username</label>
				<input bind:value={username} name="username" on:input={checkValid} spellcheck="false" class="input" class:error={errors['username']} />
			</div>

			
			<div class="flex flex-col gap-2">
				<label class="label">Icon</label>
				<IconPicker bind:value={icon} bind:color={iconColor} placement={"top"} />
			</div>
			<div class="flex flex-col gap-2">
				<label class="label">Icon Color</label>
				<IconColor bind:value={iconColor} />
			</div>
		</div>
	</div>

</div>


</SlideView>

<style>

@reference "../../../assets/main.css";

.label {
	@apply text-[14px] uppercase font-bold text-gray-500;
}

.input {
	@apply bg-white/5 p-3 rounded-lg outline-none focus:ring-1 ring-pulse-accent/50 transition-all;
}

.input.error {
	@apply bg-red-400/40 border border-red-500;
}

</style>