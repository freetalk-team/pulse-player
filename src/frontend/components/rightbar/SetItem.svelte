<script>

import AlbumItem from "./AlbumItem.svelte";
import PlaylistItem from "./PlaylistItem.svelte";
import PlaysetItem from "./PlaysetItem.svelte";

export let item;
export let ctx;
export let actions;

</script>

{#if item.type == 'album'}
	<AlbumItem {item} {ctx} {actions} />
{:else if item.type == 'playlist'}
	<PlaylistItem {item} {ctx} {actions} />
{:else if item.type == 'playset'}
	<PlaysetItem {item} {ctx} {actions} />
{/if}