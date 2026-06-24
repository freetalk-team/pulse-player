<!-- components/ui/Modal.svelte -->
<script>
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	export let title = "Are you sure?";
	export let message = "";
	export let confirmText = "Confirm";
	export let cancelText = "Cancel";
	export let danger = false;

	const dispatch = createEventDispatcher();

	const close = () => dispatch('close');
	const confirm = () => dispatch('confirm');
</script>

<!-- Backdrop -->
<div 
	on:click|self={close}
	transition:fade={{ duration: 200 }} 
	class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
>
	<!-- Modal Box -->
	<div 
		transition:scale={{ duration: 300, easing: backOut, start: 0.9 }}
		class="w-full max-w-sm bg-pulse-bg border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
	>
		<div class="p-6 text-center">
			<div class="w-12 h-12 {danger ? 'bg-red-500/20 text-red-500' : 'bg-pulse-accent/20 text-pulse-accent'} rounded-full flex items-center justify-center mx-auto mb-4">
				<i class="fa-solid {danger ? 'fa-trash-can' : 'fa-circle-question'} text-xl"></i>
			</div>
			
			<h2 class="text-lg font-bold text-white mb-2">{title}</h2>
			<p class="text-sm text-gray-400 leading-relaxed">{message}</p>
		</div>

		<div class="flex border-t border-white/5 h-14">
			<button 
				on:click={close}
				class="flex-1 text-sm font-semibold text-gray-500 hover:text-white hover:bg-white/5 transition-all"
			>
				{cancelText}
			</button>
			<button 
				on:click={confirm}
				class="flex-1 text-sm font-bold {danger ? 'text-red-500 hover:bg-red-500/10' : 'text-pulse-accent hover:bg-pulse-accent/10'} transition-all border-l border-white/5"
			>
				{confirmText}
			</button>
		</div>
	</div>
</div>
