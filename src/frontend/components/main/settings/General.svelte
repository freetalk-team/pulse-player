<script>

import { fade } from "svelte/transition";

import { clearLibrary } from "../../../stores/library";


import ToggleOption from "./ToggleOption.svelte";



</script>

<div class="flex flex-col p-6 gap-4" in:fade>

	<h1 class="text-pulse-white/80 bg-pulse-white/5 font-black tracking-wider rounded-xl p-4 text-3xl">
		<i class="fa-solid fa-gears mr-4"></i>
		General
	</h1>

	<div class="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6 w-full">

		<section class="flex flex-col gap-5">

			{#if platform.import}
				<ToggleOption enabled={true} title={"Album thumbnails"} description={"Download album thumbnails on import"}  />
				<ToggleOption enabled={true} title={"Video thumbnails"} description={"Generate video thumbnails on import"} warn={"This may slow down imports"} />
			{/if}

			<div class="flex flex-grow justify-end">

				<button 
					on:click={clearLibrary}
					class="ml-audo flex items-center gap-2 px-4 py-1 bg-red-400 text-black rounded-full font-bold hover:scale-105 transition-transform"
				>
					<i class="fa-solid fa-xmark text-[12px]"></i>
					<span class="text-sm">Delete library</span>
				</button>
			</div>

		</section>

	</div>



	<!-- <label class="flex items-center justify-between gap-4">
		<span class="text-sm">Enable notifications</span>

		<button
			role="switch"
			aria-checked={enabled}
			class="relative inline-flex h-6 w-11 items-center rounded-full transition
				{enabled ? 'bg-blue-500' : 'bg-gray-600'}"
			on:click={() => (enabled = !enabled)}
		>
			<span
				class="inline-block h-5 w-5 transform rounded-full bg-white transition
					{enabled ? 'translate-x-5' : 'translate-x-1'}"
			/>
		</button>
	</label>

	<button
		class="flex items-center gap-2 px-3 py-1.5 rounded-md transition
			{enabled ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}"
		on:click={() => (enabled = !enabled)}
	>
		<i class={`fa-solid ${enabled ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
		<span>{enabled ? 'Enabled' : 'Disabled'}</span>
	</button>

	<button
		class="px-3 py-1 rounded-md text-sm transition
			{enabled ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}"
		on:click={() => (enabled = !enabled)}
	>
		{enabled ? 'On' : 'Off'}
	</button> -->

</div>