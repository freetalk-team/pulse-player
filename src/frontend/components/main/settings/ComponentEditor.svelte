<script>


import { selectedComponent, isLoading, saveComponent, enableComponent } from '../../../stores/components';

  
import CodeEditor from '../../ui/CodeEditor.svelte';
import ConfigTable from './ConfigTable.svelte';
import Loading from '../Loading.svelte';
import ToggleButton from '../../ui/ToggleButton.svelte';


let activeTab = 'config';
let error = '';

$: component = init($selectedComponent || {});

function init(component) {
	error = '';
	return structuredClone(component);
}


// let original = { name, description, code, config };

// $: isDirty =
//   name !== original.name ||
//   description !== original.description ||
//   code !== original.code ||
//   config !== original.config;



async function save() {
    //console.log('save', { name, description, code, config });

	console.debug('Saving component:', component);

	error = '';

	for (const field of ['name', 'description']) {
		if (!check(field)) {
			error = field;
			return;
		}
	}

	const schema = component.schema;
	const config = component.config;

	for (const prop of schema) {

		if (prop.type === 'keyvalue')
			continue; /// todo

		const key = prop.key;
		const value = config[key]?.trim() ?? prop.default;

		if (prop.required) {
			if (!value) {
				console.error('Config required value not set:', key);
				error = key;
				return;
			}
		}

		if (prop.type === 'url') {
			if (!URL.parse(value)) {
				console.error('Config not valid url:', key);
				error = key;
				return;
			}
		}

		config[key] = value;
	}

	await saveComponent(component);
	

	function check(field) {
		component[field] = component[field]?.trim();
		return !!component[field];
	}


}

function discard() {
    selectedComponent.set(null);
}

function runTest() {
    console.log('run test');
}

function toggleEnable(enable) {
	if (component.id)
		enableComponent(component, enable);
}

</script>

{#if $isLoading}
	<Loading />
{:else}

<div class="flex flex-col h-full min-h-0 px-4 pt-4">
	<div class="flex items-center bg-pulse-white/5 rounded-xl min-w-0">
		
		<h2 class="flex-grow text-pulse-white/80 font-black tracking-wider text-3xl p-4 truncate min-w-0">
			<i class="fa-solid {component.type == 'album' ? 'fa-record-vinyl text-gray-700' : 'fa-music text-pulse-accent'}"></i>
			{component.id ? 'Edit' : 'New'} component
		</h2>

		<div class="flex gap-2 pr-4 flex-shrink-0">
			<button
				class="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
				on:click={discard}
			>
				<i class="fa-solid fa-rotate-left"></i>
				Discard
			</button>

			<button
				class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
				on:click={save}
			>
				<i class="fa-solid fa-floppy-disk"></i>
				Save
			</button>
		</div>
	</div>
  	<!-- Header -->
  	<div class="flex items-center justify-between px-6 py-4 gap-2 min-w-0">
		<div class="flex-grow flex flex-col gap-1 min-w-0">
			<input
				class="min-w-0 w-full text-xl font-semibold outline-none px-2 rounded {error == 'name' ? 'bg-red-400/40 border border-red-500' : 'bg-transparent'}"
				bind:value={component.name}
				spellcheck="false"
				placeholder="Component name..."
				readonly={component.builtin}
			/>
			<input
				class="min-w-0 w-full text-sm text-gray-400 outline-none px-2 rounded {error == 'description' ? 'bg-red-400/40 border border-red-500' : 'bg-transparent'}"
				placeholder="Component description..."
				bind:value={component.description}
				readonly={component.builtin}
			/>
		</div>

		<ToggleButton 
			bind:enabled={component.enabled} 
			onToggle={toggleEnable}
		/>
	</div>

	<!-- Tabs -->
	<div class="flex items-center px-6 mb-2">
		{#each ['config', 'code'] as tab}
			<button
				class={`px-6 py-2 capitalize border-b-2 transition ${
				activeTab === tab
					? 'border-pulse-accent text-pulse-white font-semibold'
					: 'border-transparent text-gray-400 hover:text-pulse-white/90'
				}`}
				on:click={() => (activeTab = tab)}
			>
				{tab}
			</button>
		{/each}
	</div>


	<div class="p-4 flex-1 min-h-0">

		{#if activeTab === 'config'}
			<ConfigTable schema={component.schema} bind:config={component.config} {error} />
		{/if}

		{#if activeTab === 'code'}
			<CodeEditor bind:value={component.code} schema={component.schema} readonly={component.builtin} />
		{/if}

		{#if activeTab === 'test'}
		<div class="flex flex-col h-full gap-4">
			<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold">Test Component</h2>
			<button
				class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
				on:click={runTest}
			>
				<i class="fa-solid fa-play"></i>
				Run
			</button>
			</div>

			<div class="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto text-sm font-mono">
			<!-- Output logs -->
			<p class="text-gray-400">Output will appear here...</p>
			</div>
		</div>
		{/if}
	</div>
</div>

{/if}
