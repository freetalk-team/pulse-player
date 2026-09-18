<!-- LinkCard.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let url;
  export let onRemove = () => {};
  
  let metadata = null;
  let loading = true;
  let error = null;
  
  async function fetchLinkMetadata() {
    try {
      loading = true;
      error = null;
      
      const result = await window.electron.invoke('process-link', url);
      
      if (result) {
        metadata = result;
      } else {
        error = 'Could not fetch link preview';
      }
    } catch (err) {
      error = err.message || 'Failed to process link';
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    fetchLinkMetadata();
  });
</script>

{#if loading}
  <div class="link-card animate-pulse bg-zinc-800/50 rounded-xl p-4">
    <div class="flex gap-3">
      <div class="w-24 h-24 bg-zinc-700 rounded-lg flex-shrink-0"></div>
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-zinc-700 rounded w-3/4"></div>
        <div class="h-3 bg-zinc-700 rounded w-full"></div>
        <div class="h-3 bg-zinc-700 rounded w-2/3"></div>
        <div class="h-3 bg-zinc-700 rounded w-1/4"></div>
      </div>
    </div>
  </div>
{:else if error}
  <div class="link-card bg-zinc-800/30 rounded-xl p-3 border border-zinc-700">
    <div class="flex items-center justify-between">
      <span class="text-zinc-500 text-sm truncate">{url}</span>
      <button
        on:click={onRemove}
        class="text-zinc-600 hover:text-zinc-400 transition-colors"
        aria-label="Remove link"
      >
        ✕
      </button>
    </div>
    <p class="text-zinc-600 text-xs mt-1">{error}</p>
  </div>
{:else}
  <div class="link-card bg-zinc-800/30 rounded-xl overflow-hidden border border-zinc-700 hover:border-zinc-600 transition-colors">
    {#if metadata.image}
      <div class="relative w-full h-48 bg-zinc-900">
        <img
          src={metadata.image}
          alt={metadata.title}
          class="w-full h-full object-cover"
          on:error={(e) => (e.target.style.display = 'none')}
        />
        <button
          on:click={onRemove}
          class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-sm transition-colors"
          aria-label="Remove link"
        >
          ✕
        </button>
      </div>
    {/if}
    
    <div class="p-3">
      <div class="flex items-start gap-2">
        <div class="flex-1 min-w-0">
          {#if metadata.title}
            <h3 class="text-sm font-medium text-white line-clamp-2">
              {metadata.title}
            </h3>
          {/if}
          
          {#if metadata.description}
            <p class="text-xs text-zinc-400 line-clamp-2 mt-1">
              {metadata.description}
            </p>
          {/if}
          
          <div class="flex items-center gap-2 mt-2">
            {#if metadata.favicon}
              <img
                src={metadata.favicon}
                alt=""
                class="w-4 h-4 rounded"
                on:error={(e) => (e.target.style.display = 'none')}
              />
            {/if}
            <span class="text-xs text-zinc-500 truncate">
              {metadata.siteName}
            </span>
          </div>
        </div>
        
        {#if !metadata.image}
          <button
            on:click={onRemove}
            class="flex-shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Remove link"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
