<!-- RepeatSelector.svelte -->
<script>
    export let value = 'None'; // Default assignment string

    const options = [
        { id: 'None', label: 'Once', icon: 'fa-solid fa-calendar-day' },
        { id: 'Daily', label: 'Daily', icon: 'fa-solid fa-clock' },
        { id: 'Weekly', label: 'Weekly', icon: 'fa-solid fa-calendar-days' }
    ];

    $: activeIndex = options.findIndex(opt => opt.id === value);
</script>

<div class="relative flex items-center bg-zinc-950 border border-zinc-800 rounded-xl h-10 p-1 text-xs gap-1 select-none overflow-hidden w-full">
    <!-- Active Sliding Track Indicator -->
    {#if activeIndex !== -1}
        <div 
            class="absolute top-1 bottom-1 bg-purple-600 rounded-lg transition-all duration-300 ease-out z-0 shadow-md shadow-purple-600/10"
            style:width="calc((100% - 8px) / 3)"
            style:left="calc(4px + ({activeIndex} * (100% - 8px) / 3))"
        ></div>
    {/if}

    {#each options as option}
        <button
            type="button"
            on:click={() => value = option.id}
            class="relative flex-1 h-full flex items-center justify-center gap-2 font-medium transition-colors duration-200 z-10 focus:outline-none truncate px-2
                {option.id === value ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}"
        >
            <i class="{option.icon} text-[11px] {option.id === value ? 'opacity-100' : 'opacity-60'}"></i>
            <span>{option.label}</span>
        </button>
    {/each}
</div>

<style>
    div { will-change: transform; }
</style>
