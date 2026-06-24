<script>

import { scrollHover } from '../../actions';
import { currentSettings } from '../../stores/settings';

import GeneralSettings from './settings/General.svelte';
import InterfaceSettings from './settings/Interface.svelte';
import About from './settings/About.svelte';

import ComponentEditor from './settings/ComponentEditor.svelte';

</script>


<div class="flex-grow flex flex-col min-h-0 min-w-0 overflow-hidden h-full">

	{#if $currentSettings === 'component'}
			<ComponentEditor />
	{:else}

		<div
			use:scrollHover
			class="flex-grow custom-scroll overflow-y-auto px-6 relative"
		>


			{#if $currentSettings === 'general'}
				<GeneralSettings />
			{:else if $currentSettings === 'ui'}
				<InterfaceSettings />
			{:else if $currentSettings === 'about'}
				<About />
			{:else}

				<h1>{$currentSettings}</h1>

			{/if}


		</div>

	{/if}

</div>

