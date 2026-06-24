<script>

import { fade } from "svelte/transition";

import ToggleOption from "./ToggleOption.svelte";

</script>

<div class="flex flex-col p-6 gap-4" in:fade>

	<h1 class="text-pulse-white/80 bg-pulse-white/5 font-black tracking-wider rounded-xl p-4 text-3xl">
		<i class="fa-solid fa-palette mr-4"></i>
		Interface
	</h1>

	<div class="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6 w-full">
		<section class="p-2 mt-6 gap-5 flex flex-col">
			<ToggleOption enabled={true} title={"Video preview"} description={"Play video on track mouse hover"} />
		</section>

	</div>
</div>