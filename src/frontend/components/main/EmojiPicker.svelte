<script>

import data from '@emoji-mart/data';
import { Picker } from 'emoji-mart';

import {
	createEventDispatcher,
	onMount,
	onDestroy,
	tick
} from 'svelte';

import { portal } from 'svelte-portal';

import { clickOutside } from '../../actions';

export let anchor;
export let show = false;

const dispatch = createEventDispatcher();

let pickerContainer;
let picker;

let top = 0;
let left = 0;

function updatePosition() {

	if (!anchor || !pickerContainer) return;

	const rect = anchor.getBoundingClientRect();

	const pickerWidth = 352;
	const pickerHeight = 435;

	// default: show above button
	top = rect.top - pickerHeight - 8;
	left = rect.left;

	// if not enough space above -> show below
	if (top < 8) {

		top = rect.bottom + 8;
	}

	// prevent overflow right
	if (left + pickerWidth > window.innerWidth - 8) {

		left = window.innerWidth - pickerWidth - 8;
	}

	// prevent overflow left
	if (left < 8) {

		left = 8;
	}
}

onMount(async () => {

	const theme =
		document.documentElement.classList.contains('light-theme')
			? 'light'
			: 'dark';

	picker = new Picker({
		data,
		theme,

		onEmojiSelect: (emoji) => {

			dispatch('select', emoji.native);
		}
	});

	pickerContainer.appendChild(picker);

	await tick();

	updatePosition();

	window.addEventListener('resize', updatePosition, true);
	window.addEventListener('scroll', updatePosition, true);
});

onDestroy(() => {

	window.removeEventListener('resize', updatePosition, true);
	window.removeEventListener('scroll', updatePosition, true);

	picker?.remove();
});

</script>

{#if show}

<div
	use:portal={'body'}
	use:clickOutside={() => show = false }
	bind:this={pickerContainer}
	class="fixed z-[9999] rounded-3xl border border-pulse-white/10 bg-pulse-black shadow-2xl"
	style="
		top: {top}px;
		left: {left}px;
	"
></div>

{/if}