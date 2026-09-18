<script context="module">

let contextMenuCloser;

export function setContextMenu(closer) {
	contextMenuCloser?.();
	contextMenuCloser = closer;
}

export function closeContextMenu() {
	contextMenuCloser?.();
	contextMenuCloser = null;
}

</script>

<script>

import { fly } from "svelte/transition";
import { clickOutside } from "../../actions";

export let item;
export let pos;
export let close;
export let content;

</script>

<div
	class="context-menu"
	style="top: {pos.y}px; left: {pos.x}px;"
	transition:fly={{ y: 5, duration: 150 }}
	on:click|stopPropagation
	use:clickOutside={close}
>
    {@render content?.(item)}
</div>
