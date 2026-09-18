<script>

import ToggleOption from "../ToggleOption.svelte";

</script>

<section class="panel">
	<h3 class="head">
		<i class="fa-solid fa-file-import mr-2"></i>
		Import
	</h3>
	<div class="mt-4 space-y-6 p-4">
		<ToggleOption enabled={true} title={"Album thumbnails"} description={"Download album thumbnails on import"}  />
		<ToggleOption enabled={true} title={"Video thumbnails"} description={"Generate video thumbnails on import"} warn={"This may slow down imports"} />
	</div>
</section>