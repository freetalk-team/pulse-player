<script>

export let value = 0; // 0 - 100

</script>

<div class="w-full h-2 bg-zinc-950 rounded-full border border-zinc-800/80 overflow-hidden relative">
	<div 
		class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
		style:width="{value}%"
	></div>
</div>