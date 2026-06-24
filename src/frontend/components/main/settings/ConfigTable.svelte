<script>

export let schema = [];
export let config = {};
export let error = '';

function update(key, val) {
	config[key] = val;
}

function addHeader() {
	config.headers = [...config.headers, { key: '', value: '' }];
}

function removeHeader(index) {
	config.headers = config.headers.filter((_, i) => i !== index);
}

</script>

<div class="rounded-xl overflow-hidden">
	<table class="w-full text-sm">
		<thead class="bg-pulse-white/10 text-gray-400 mb-4">
			<tr>
			  <th class="text-left px-4 py-3 w-1/3">Setting</th>
			  <th class="text-left px-4 py-3">Value</th>
			</tr>
		</thead>
		<tbody>
			{#each schema as field}
			  <tr class="border-gray-600">
				<td class="px-4 py-3">
				  <div class="font-medium text-pulse-white">
					{field.label}
					{#if field.required}
					  <span class="text-red-400 ml-1">*</span>
					{/if}
				  </div>
				</td>

				<td class="px-4 py-3">
					{#if ['text', 'password', 'url'].includes(field.type )}
						<input
							class="w-full border rounded-lg px-3 py-2 {error == field.key ? 'bg-red-400/40 border-red-500' : 'bg-pulse-white/5 border-gray-700'}"
							type={field.type}
							value={config[field.key] || ''}
							spellcheck="false"
							readonly={field.readonly}
							on:input={(e) => update(field.key, e.target.value)}
						/>

					{:else if field.type === 'keyvalue'}
						<div class="space-y-2">
						{#each config.headers as row, i}
							<div class="flex gap-2">
								<input
									class="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1"
									placeholder="Key"
									value={row.key}
									spellcheck="false"
									on:input={(e) => (row.key = e.target.value)}
								/>
								<input
									class="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1"
									placeholder="Value"
									value={row.value}
									spellcheck="false"
									on:input={(e) => (row.value = e.target.value)}
								/>
								<button
									class="px-2 text-red-400 hover:text-red-300"
									on:click={() => removeHeader(i)}
								>
									<i class="fa-solid fa-xmark"></i>
								</button>
							</div>
						{/each}

						<button
							class="text-sm text-blue-400 hover:underline"
							on:click={addHeader}
						>
							+ Add header
						</button>
						</div>
					{:else if field.type === 'select'}
						<select
							class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
							value={config[field.key]}
							on:change={(e) => update(field.key, e.target.value)}
						>
							{#each field.options as opt}
							<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					{/if}

				</td>
			  </tr>
			{/each}
		</tbody>
	</table>
</div>
