<script>

export let rating = 0;

</script>

<div class="flex gap-0.5 text-[8px]">
	{#each Array(5) as _, i}
		<i class="fa-solid fa-star {i < Math.floor(rating / 10) ? 'text-pulse-accent' : 'text-gray-700'}"></i>
	{/each}
</div>