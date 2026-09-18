<script>

import { genres } from '../../../stores/library';

import Select from './SelectInput.svelte';

export let value = "";
export let onChange;

$: filtered = $genres.filter(g => 
	g.toLowerCase().includes(value?.toLowerCase())
);

</script>

<Select items={filtered} bind:value={value} {onChange} />
