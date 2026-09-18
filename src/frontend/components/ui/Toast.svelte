<script context="module">

import { writable } from 'svelte/store';

export const toastStore = writable({ message: '', type: '', visible: false });

export function triggerToast(message, type = 'success') {
    toastStore.set({ message, type, visible: true });
    setTimeout(() => {
        toastStore.update(state => ({ ...state, visible: false }));
    }, 4000);
}

</script>

<script>

import { fade, fly } from 'svelte/transition';

</script>

{#if $toastStore.visible}
  <div 
    in:fly={{ y: 20, duration: 400 }} 
    out:fade={{ duration: 300 }}
    class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md max-w-sm
           {$toastStore.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}"
  >
    <div class="text-sm shrink-0">
      {#if $toastStore.type === 'error'}
        <i class="fa-solid fa-server"></i>
      {:else}
        <i class="fa-solid fa-code"></i>
      {/if}
    </div>
    <p class="text-xs font-semibold tracking-wide leading-snug">{$toastStore.message}</p>
  </div>
{/if}
