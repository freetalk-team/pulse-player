<script>
// import ScannerWorker from '../workers/scanner.js?worker';

export let droppedPaths = [];

let isScanning = false;
let folderInput; // Reference for the hidden browser input

// Reactively watch for new drops from the parent
$: if (droppedPaths.length > 0) {
	handleImport(droppedPaths);
	droppedPaths = []; // Reset so it can trigger again
}

async function handleImport(paths) {
	if (!paths || paths.length === 0) return;
	
	isScanning = true;
	try {
		console.log('Scanning paths:', paths);
		
		await api.scanFolders(paths);
	} catch (err) {
		console.error(err);
	} finally {
		isScanning = false;
	}
}

async function handleButtonClick() {
	const paths = await api.dialogOpenDirectory();

	handleImport(paths);
}

</script>

<div class="p-4 border-pulse-border">
	<!-- Hidden Browser Input -->
	<input 
		type="file" 
		webkitdirectory 
		multiple 
		class="hidden" 
		bind:this={folderInput} 
	/>

	<button 
		on:click={handleButtonClick}
		disabled={isScanning}
		class="w-full py-2 bg-pulse-accent text-black font-bold rounded-md hover:brightness-110 active:scale-95 disabled:opacity-50"
	>
		{isScanning ? 'Scanning...' : 'Import Library'}
	</button>
</div>
