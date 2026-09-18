<script>

import { markdown } from '../../../../utils/md';

import TrackCard from './TrackCard.svelte';
import AlbumCard from './AlbumCard.svelte';
import PlaylistCard from './PlaylistCard.svelte';
import PlaysetCard from './PlaysetCard.svelte';
import RadioCard from './RadioCard.svelte';

export let post;
export let onDownload;

</script>

{#if post.item}
	{#if post.type == 'track'}
		<TrackCard item={post.item} {onDownload} />
	{:else if post.type == 'album'}
		<AlbumCard item={post.item} {onDownload} />
	{:else if post.type == 'playlist'}
		<PlaylistCard item={post.item} {onDownload} />
	{:else if post.type == 'playset'}
		<PlaysetCard item={post.item} />
	{:else if post.type == 'radio'}
		<RadioCard item={post.item} />
	{/if}
{/if}

<div class="prose prose-invert max-w-none">
	{@html markdown(post.content)}
</div>