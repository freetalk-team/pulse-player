
<script>

export let selected = false;

</script>

<div class="relative overflow-hidden h-full overflow-hidden min-w-0">

    <div
        class="view-slide"
        class:-translate-x-full={selected}
        class:pointer-events-none={selected}
    >
        <slot name="master"/>
    </div>

    <div
        class="view-slide"
        class:translate-x-0={selected}
        class:translate-x-full={!selected}
        class:pointer-events-none={!selected}
    >
        <slot name="detail" item={selected}/>
    </div>

</div>

<style>

@reference "../../assets/main.css";

.view-slide {
    @apply absolute inset-0 transition-transform duration-300 flex flex-col min-h-0 min-w-0;
}

</style>