<!-- LoadingSplash.svelte -->
<script>
    export let message = "";
    import { fade } from 'svelte/transition';
</script>

<div out:fade={{ duration: 300 }} class="absolute inset-0 flex flex-col items-center justify-center bg-pulse-bg z-50">
    <div class="w-12 h-12 border-2 border-pulse-accent/20 border-t-pulse-accent rounded-full animate-spin mb-4"></div>
    <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 animate-pulse">
        {message}
    </p>
</div>
