<script>

import { fly, slide } from 'svelte/transition';
import { quintOut, cubicOut } from "svelte/easing";

import { scrollHover } from '../../actions';
import { isLoading } from '../../stores/ui';
import { activeTab, editPlaylist } from '../../stores/home';
import { isImporting } from '../../stores/tracks';

import Grid from './GridCollections.svelte'; 
import HomeTabs from './HomeTabs.svelte';
import HomePlaylistEditor from './HomePlaylistEditor.svelte';
import Video from './Video.svelte';

import Search from './Search.svelte';
import Filters from './Filters.svelte';
import Loading from './Loading.svelte';
import FileImport from '../ui/FileImport.svelte';
import ImportButtons from '../ui/ImportButtons.svelte';

const duration = 400;

let width = 0;

function measure(node) {
	width = node.offsetWidth;
	return {
		destroy() {}
	};
}

function finishEditing() {
	editPlaylist.set(null);
}

</script>

<div 
	use:measure
	class="relative overflow-hidden h-full">
	{#if $editPlaylist}
		<div 
			in:fly={{ x: width, duration, easing: cubicOut}} 
			out:fly={{ x: width, duration }}
			class="bg-pulse-bg w-full h-full "
		>
			<HomePlaylistEditor playlist={$editPlaylist} close={finishEditing} />
		</div>
	{:else}
		<div 
			in:fly={{ x: -width, duration, easing: cubicOut }} 
			out:fly={{ x: -width, duration }} 
			class="w-full h-full"
		>
			<div class="flex flex-col justify-between mb-12 mt-4 gap-4 overflow-hidden h-full">
				<div class="flex flex-col p-4">
					<div class="flex items-center justify-between text-3xl">
						<h1 class="flex-grow font-black uppercase tracking-wider text-white/40">Your Collections</h1>
						{#if $isImporting}
							<FileImport />
						{:else if platform.import}
							<div class="flex items-center gap-3 px-4 py-2 opacity-60 hover:opacity-100 transition-all duration-300 bg-white/10 rounded-lg">
								<ImportButtons />
							</div>
						{/if}
					</div>
					<p class="text-xs text-gray-500 font-medium">Welcome back to your Pulse library</p>
				</div>
				
				<div class="flex items-center w-full px-4">
					<div class="flex-grow">
						<HomeTabs />
					</div>
					<div class="flex-shrink-0 flex items-center justify-between px-6 py-2 gap-4">
						<!-- Search input takes the remaining space -->
						<div class="flex-grow max-w-xl">
							<Search />
						</div>
						
						<!-- Filters stay at the end of the row -->
						<Filters />
					</div>
				</div>

				<div use:scrollHover
					class="flex-grow custom-scroll overflow-y-auto p-6"
				>
					{#if $isLoading}
						<Loading />
					{:else}
						<Video />
						<Grid active={activeTab} />
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
