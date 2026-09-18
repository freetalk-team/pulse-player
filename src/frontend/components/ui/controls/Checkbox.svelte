<script>

export let checked = false;
export let label = "";
export let accent = "pulse";

const AccentColors = {
	purple: 'bg-purple-600 border-purple-500 shadow-purple-600/20',
	red: 'bg-red-600 border-red-500 shadow-red-600/20',
	pulse: 'bg-pulse-accent/90 border-pulse-accent shadow-pulse-accent/20',
};

</script>

<label class="flex items-center gap-3 cursor-pointer select-none group text-xs text-gray-400 hover:text-gray-200 transition-colors">
	<!-- Hidden Native Input for accessibility and form safety -->
	<input 
		type="checkbox" 
		bind:checked 
		class="sr-only" 
	/>

	<!-- Custom Styled Box Wrapper -->
	<div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 relative overflow-hidden
		{checked 
			? `${AccentColors[accent]} shadow-md scale-100`
			: 'border-white/10 bg-black/40 group-hover:border-white/20'}"
	>
		<!-- Font Awesome Check Mark Icon -->
		<i class="fa-solid fa-check text-[10px] text-white transition-all duration-200 transform
			{checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}"
		></i>

		<!-- Gentle Hover Border Glow Grid -->
		<div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
	</div>

	<!-- Label Text -->
	{#if label}
		<span class="font-medium tracking-tight">{label}</span>
	{/if}
</label>
