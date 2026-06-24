<script>

export let rating;

</script>

<div class="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 
			bg-black/60 backdrop-blur-md border border-white/10 rounded-full 
			text-[9px] font-black text-white/80 transition-all group-hover:scale-110">
	<i class="fa-solid fa-star text-pulse-accent text-[8px]"></i>
	<span>{rating}</span>
</div>