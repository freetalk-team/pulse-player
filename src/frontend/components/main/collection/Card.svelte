<script>

import AlbumCard from '../album/Card.svelte';
import PlaylistCard from '../playlist/Card.svelte';
import PlaysetCard from '../playset/Card.svelte';

export let item;
export let isEditing;
export let isSelected = false;
export let onSelect;
export let onDragStart;
export let onDragEnd;
export let openContextMenu;

</script>

{#if item.type == 'album'}
    <AlbumCard {item} {isEditing} {isSelected} {onSelect} {onDragStart} {onDragEnd} {openContextMenu} />
{:else if item.type == 'playlist'}
    <PlaylistCard {item} {isEditing} {isSelected} {onSelect} {onDragStart} {onDragEnd} {openContextMenu} />
{:else if item.type == 'playset'}
    <PlaysetCard {item}  {openContextMenu} />
{/if}