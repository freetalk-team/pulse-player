<script>

import { tooltip } from "../../actions";

import TrackItem from "./TrackItem.svelte";

export let item;
export let index;

</script>

<TrackItem {item} {index}>
	<div>
		<button 
			use:tooltip={"Remove"}
			class="text-red-500"
		>
			<i class="fa-solid fa-remove text-[10px]"></i>
		</button>
	</div>

</TrackItem>
