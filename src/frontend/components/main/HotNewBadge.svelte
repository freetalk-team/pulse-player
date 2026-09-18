<script>

export let item;

const isNew = !item.played_at;
const isHot = item.total_rating > 100;

</script>

{#if isNew}
	<div class="bg-pulse-accent/40 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
		NEW
	</div>
{:else if isHot}
	<div class="bg-orange-500/50 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
		HOT
	</div>
{/if}