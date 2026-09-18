<script>

import { Colors } from '../../ui/icons';

import { getDownloadOptions, saveDownloadOptions, download } from '../../../stores/remote/downloads';
import { runPremiumAction } from '../../PremiumLockModal.svelte';

import Home from './RemoteHome.svelte';
import Library from './RemoteLibrary.svelte';
import DownloadModal from "./DownloadOptions.svelte";

export let remote;

let activeTab = 'home';

let showModal = false;
let downloadItem;
let downloadType;
let downloadOptions;

function onDownload(type, item) {

	console.debug('On download:', type);

	if (['album', 'playlist'].includes(type) && !runPremiumAction('REMOTE_DOWNLOAD')) {
		return;
	}

	const opt = getDownloadOptions(type);

	if (opt.skipOptions) {
		startDownload(type, item, opt);
	}
	else {
		downloadType = type;
		downloadItem = item;
		downloadOptions = opt;

		showModal = true;
	}
}

function handleConfirmDownload(item, opt) {

	const type = downloadType;

	saveDownloadOptions(type, opt);
	startDownload(type, item, opt);
}

function getDownloadDir(item, opt) {
	return `${opt.rootDir}/${opt.subdirPattern.trim()}`
		.replaceAll('[ARTIST]', item.artist)
		.replaceAll('[ALBUM]', item.name)
		.replaceAll('[ALBUM_YEAR]', item.year ? `${item.name} (${item.year})` : item.name)
		.replace('[GENRE]', item.genre)
		.replace(/\/+/g, '/'); // Clean up any duplicate backslashes
}

function startDownload(type, item, opt) {
	download(type, item, {
		dir: getDownloadDir(item, opt),
		filename: opt.filenamePattern.trim(),
		overwrite: opt.overwrite
	});
}

</script>

<DownloadModal bind:show={showModal} opt={downloadOptions} item={downloadItem} onConfirm={handleConfirmDownload} />

<div class="flex h-full flex-col overflow-hidden min-w-0">

	<div class="flex items-center gap-4 rounded-xl p-4 m-4 bg-pulse-white/5">
		<i class="fa-solid text-3xl {remote.icon || 'fa-computer'}" style:color={Colors[remote.iconColor || 'accent']}></i>
		<div class="flex-grow flex flex-col">
			<h2 class="text-pulse-white/80 font-black tracking-wider text-xl">
				{remote.hostname}
			</h2>
			<i class="text-sm text-gray-600">{remote.address}:{remote.port}</i>
		</div>
		
	</div>

	<div class="flex items-center px-6 mb-2">
		{#each [{id: 'home', icon: 'home'}, { id: 'library', icon: 'book-open' }] as tab}
			<button
				class="px-6 py-2 flex items-center gap-3 capitalize border-b-2 transition {activeTab === tab.id ? 'border-pulse-accent text-pulse-accent font-semibold tracking-wider' : 'border-transparent text-gray-400 hover:text-pulse-white/90'}"
				on:click={() => (activeTab = tab.id)}
			>
				<i class="fa-solid fa-{tab.icon} text-sm"></i>
				{tab.id.capitalizeFirstLetter()}
			</button>
		{/each}
	</div>

	{#if activeTab == 'home'}
		<Home {onDownload} />
	{:else}
		<Library {onDownload}/>
	{/if}
</div>
