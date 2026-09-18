<script>

import { fade } from "svelte/transition";

import Radio from "./general/Radio.svelte";
import Downloads from "./general/Downloads.svelte";
import Import from "./general/Import.svelte";
import Recordings from "./general/Recordings.svelte";
import Database from "./general/Database.svelte";

</script>

<div class="flex flex-col p-6 gap-4" in:fade>

	<h1 class="text-pulse-white/80 bg-pulse-white/5 font-black tracking-wider rounded-xl p-4 text-3xl">
		<i class="fa-solid fa-gears mr-4"></i>
		General
	</h1>

	<div class="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8 w-full">
		<Radio />
		<Import />
		<Downloads />
		<Recordings />
		<Database />
	</div>

</div>
