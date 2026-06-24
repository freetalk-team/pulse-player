
<script>

import { currentRemote } from "../../stores/remote";

import Home from "./remote/Home.svelte";
import Remote from "./remote/Remote.svelte";

</script>

{#if $currentRemote}
	<Remote remote={$currentRemote} />
{:else}
	<Home />
{/if}
