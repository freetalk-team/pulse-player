<script>

import { tooltip } from "../../actions";

import TrackItem from './TrackItem.svelte';

export let item;

</script>

<TrackItem {item}>
	<div>
		<button 
			use:tooltip={"Play"}
			class="text-pulse-accent"
		>
			<i class="fa-solid fa-play text-[10px]"></i>
		</button>
		<button 
			use:tooltip={"Remove"}
			class="text-red-500"
		>
			<i class="fa-solid fa-remove text-[10px]"></i>
		</button>
	</div>

</TrackItem>
