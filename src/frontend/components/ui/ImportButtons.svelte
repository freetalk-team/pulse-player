<script>

import { tooltip } from "../../actions";


async function handleImportFiles() {
	const paths = await api.dialogOpenFile();

	handleImport(paths);
}

async function handleImportFolders() {
	const paths = await api.dialogOpenDirectory();

	handleImport(paths);
}

async function handleImport(paths) {
	if (!paths || paths.length === 0) return;
	
	try {
		console.log('Scanning paths:', paths);
		
		await api.scanFolders(paths);
	} catch (err) {
		console.error(err);
	} finally {
	}
}
	
</script>


<span class="uppercase tracking-widest font-black font-bold text-[60%] text-gray-300">
	<i class="fa-solid fa-floppy-disk"></i>
	Import
</span>

<button 
	on:click={handleImportFiles}
	use:tooltip={"Files"}
	class="flex items-center hover:scale-105 transition-transform"
>
	<i class="fa-solid fa-file-medical fa-rotate-270 text-pulse-accent/80 hover:text-pulse-accent"></i>
</button>

<button 
	on:click={handleImportFolders}
	use:tooltip={"Folders"}
	class="flex items-center hover:scale-105 transition-transform"
>
	<i class="fa-solid fa-folder-plus fa-fw text-blue-500/80 hover:text-blue-500"></i>
</button>
	

	