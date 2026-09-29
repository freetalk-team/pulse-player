<script>

import { remoteEnabled, enableRemote } from "../../../../stores/remote";

import ToggleOption from "../ToggleOption.svelte";

</script>

<section class="panel">
	<h3 class="head">
		<i class="fa-solid fa-share-nodes mr-2"></i>
		Remote
	</h3>
	<div class="mt-4 space-y-6 p-4">
		<ToggleOption 
            enabled={$remoteEnabled}
            title={"Enable remote"} 
            description={"Access remote player instances"}
            onToggle={enableRemote}
        />
	</div>
</section>