<script>

import { onMount } from "svelte";

import Select from "../../../ui/controls/Select.svelte";

const radioProviders = [
	{ id: 'radio-browser', label: 'Radio browser' }, 
	{ id: 'sipme', label: 'Sipme'} 
];

let radioProvider;

onMount(() => {
	radioProvider = api.getPref('radio.api');

	console.debug('Radio provider:', radioProvider);
});


function onChangeProvider(provider) {
	console.debug('On change provider', provider);

	api.setPref('radio.api', provider);
}

</script>

<section class="panel">
	<h3 class="head">
		<i class="fa-solid fa-radio mr-2"></i>
		Online radio
	</h3>
	<div class="mt-4 space-y-6 p-4">
		<label class="label flex-grow">Provider</label>
		<div class="max-w-[250px]">
			<Select items={radioProviders} value={radioProvider} onChange={onChangeProvider} />
		</div>
	</div>
</section>