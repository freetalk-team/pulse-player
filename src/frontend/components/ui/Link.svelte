<script>

export let url;

</script>

{#if isElectron}

<a href="#" on:click|preventDefault={() => api.openExternal(url)} class="link">
    <slot name="content" />
</a>

{:else}

<a href="${url}" target="_blank" class="link">
    <slot name="content" />
</a>

{/if}