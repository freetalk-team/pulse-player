<script>

export let filter;
export let collection;

function formatTitle(filter) {
	switch (filter) {

		case '':
		case 'all':
		return 'Media';

		case 'audio':
		return 'Audio tracks';

		case 'video':
		return 'Video clips';

		case 'collections':
		return 'Albums and playlists';

		case 'sets':
		return 'Albums, playlists and playsets';

		default:
		return filter.capitalizeFirstLetter();
	}
}

</script>

<h2 class="font-lucida-sans uppercase text-2xl font-black tracking-wider truncate">
	{#if collection}
		{collection.name}
	{:else}
		{formatTitle(filter)}
	{/if}
</h2>