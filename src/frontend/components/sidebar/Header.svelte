<script>

import { currentLayout } from '../../stores/ui.js';
import { isImporting } from '../../stores/tracks.js';

import FileImport from '../ui/FileImport.svelte';
import ImportButtons from '../ui/ImportButtons.svelte';

</script>

<div class="flex items-center p-2 pl-4 mb-1"started>
	<h3 class="flex-grow truncate text-xs font-bold uppercase text-gray-500 tracking-widest">
		{$currentLayout.capitalizeFirstLetter()}
	</h3>
	{#if platform.import && !$isImporting}
		<div class="flex items-center gap-2 px-2 py-1 opacity-60 hover:opacity-100 transition-all duration-300 bg-pulse-white/10 rounded-lg">
			<ImportButtons />
		</div>
	{/if}
</div>

{#if $isImporting}
	<div class="p-1">
		<FileImport />
	</div>
{/if}