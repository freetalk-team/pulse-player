<script>

import { slide } from 'svelte/transition'; // 1. Import slide

import Badge from './Badge.svelte';
	
export let title = "Playlist";
export let icon = "fa-list-ul";
export let iconColor = "text-white/80"; // 2. Must be a full class name
export let count;

let isOpen = true;
const toggle = () => (isOpen = !isOpen);

</script>

<div class="group/list flex flex-col mb-2 select-none">
	<!-- GROUP HEADER -->
	<div 
		class="flex items-center gap-2 p-2 mb-1 cursor-pointer hover:bg-white/5 transition-colors rounded-md group"
		on:click={toggle}
	>
		<i class="fa-solid fa-angle-down text-[10px] transition-transform duration-300 {isOpen ? '' : '-rotate-90'}"></i>
		
		<!-- 3. Use the variable directly -->
		<i class="fa-solid {icon} {iconColor} text-xs"></i>
		
		<span class="flex-grow text-xs font-bold uppercase tracking-widest text-gray-400 truncate h-4 leading-4">{title}</span>
	
		<!-- <div class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 h-4" 
			on:click|stopPropagation>
			<slot name="actions" />
		</div> -->
		<div class="flex items-center gap-2 h-4" 
			on:click|stopPropagation>
			<slot name="actions" />
		</div>

		{#if count}
			<Badge count={count} />
		{/if}
	</div>

	<!-- CONTENT (With Slide Transition) -->
	{#if isOpen}
		<div transition:slide={{ duration: 300 }} class="flex flex-col flex-grow"> 
			<slot />
		</div>
	{/if}
</div>
