<!-- PostEditor.svelte -->
<script>
  import { onMount } from 'svelte';
  import LinkCard from './LinkCard.svelte';
  
  let content = '';
  let links = [];
  let isProcessing = false;
  
  function extractLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }
  
  function handleContentInput() {
    const extractedLinks = extractLinks(content);
    const newLinks = extractedLinks.filter(
      url => !links.some(link => link.url === url)
    );
    
    if (newLinks.length > 0) {
      links = [...links, ...newLinks.map(url => ({ url, metadata: null }))];
    }
    
    // Remove links that are no longer in content
    links = links.filter(link => content.includes(link.url));
  }
  
  function removeLink(index) {
    links = links.filter((_, i) => i !== index);
  }
  
  // Preprocess links when content changes
  $: handleContentInput();
</script>

<div class="post-editor">
  <textarea
    bind:value={content}
    on:input={handleContentInput}
    rows="1"
    placeholder="What's on your mind? Paste a link to create a preview..."
    class="custom-scroll overflow-y-auto flex-1 resize-none rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
    style="field-sizing: content; max-height: calc(1.5em * 5 + 0.75rem);"
  />
  
  <!-- Link Cards -->
  {#if links.length > 0}
    <div class="mt-3 space-y-2">
      {#each links as link, index}
        <LinkCard
          url={link.url}
          onRemove={() => removeLink(index)}
        />
      {/each}
    </div>
  {/if}
  
  <!-- Post Button -->
  <button
    on:click={() => {
      // Submit post with content and links data
      console.log('Post:', { content, links });
    }}
    disabled={!content.trim()}
    class="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-2 px-4 rounded-xl transition-colors"
  >
    Post
  </button>
</div>

<style>
  /* Add any additional styles */
</style>
