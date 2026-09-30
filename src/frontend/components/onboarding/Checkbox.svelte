<script>

export let checked = false;
export let label = '';
export let description = '';


</script>

<label class="flex items-center gap-3 cursor-pointer select-none group text-xs text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80">
	<input 
		type="checkbox" 
		bind:checked
		class="sr-only" 
	/>

	<div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 relative overflow-hidden
		{checked 
			? 'bg-purple-600 border-purple-500 shadow-md shadow-purple-600/20 scale-100' 
			: 'border-white/10 bg-black/40 group-hover:border-white/20'}"
	>
		<i class="fa-solid fa-check text-[10px] text-white transition-all duration-200 transform
			{checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}"
		></i>
		<div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
	</div>

	<div class="flex flex-col text-left">
		<span class="font-semibold tracking-tight text-sm text-zinc-200">{label}</span>
		<span class="text-[11px] text-zinc-500 mt-0.5">{description}</span>
	</div>
</label>