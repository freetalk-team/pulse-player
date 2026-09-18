<script>

import { fade } from 'svelte/transition';

import ContextMenu, { setContextMenu} from '../ui/ContextMenu.svelte';
import GridSentinel from './LoadSentinel.svelte';

export let component;
export let items;
export let selectedItem;
export let isLoading = false;
export let hasMore = false;
export let fetch;
export let searchQuery = '';
export let componentProps = {};

let contextItem;
let contextPos;
let contextMenuContent;

function closeContextMenu() {
	contextItem = null;
}

function openContextMenu(e, item, content) {
	e.preventDefault();

	setContextMenu(closeContextMenu);

	contextItem = item;
	contextMenuContent = content;
	contextPos = {
		x: e.clientX,
		y: window.innerHeight - e.clientY < 200 ? e.clientY - 150 : e.clientY
	};
}

</script>

{#if contextItem}
	<ContextMenu pos={contextPos} item={contextItem} content={contextMenuContent} close={closeContextMenu} />
{/if}

<div class="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 md:gap-6">
	{#each items as item (item.id)}
		<div in:fade={{ duration: 400 }}>
			<svelte:component
				this={component}
				{item}
				isSelected={
					selectedItem instanceof Set || selectedItem instanceof Map
						? selectedItem.has(item.id)
						: selectedItem?.id === item.id
				}
				{searchQuery}
				{openContextMenu}
				{...componentProps}
			/>

		</div>
	{/each}
	
</div>

<GridSentinel isLoading={isLoading} hasMore={hasMore} {fetch} />

