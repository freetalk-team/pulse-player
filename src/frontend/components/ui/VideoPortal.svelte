<script>
    import { onMount } from 'svelte';
    import { videoPortalRect, mainViewportRect } from '../../stores/layout';

    let wrapper;
    let frame;

    function sync() {
        if (!wrapper) return;
        
        // 1. Get Portal Position
        const rect = wrapper.getBoundingClientRect();
        videoPortalRect.set({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom
        });

        // 2. Get Scrollable Parent Boundaries (The "Main" container)
        const scrollParent = wrapper.closest('.custom-scroll');
        if (scrollParent) {
            const parentRect = scrollParent.getBoundingClientRect();
            mainViewportRect.set({
                top: parentRect.top,
                bottom: parentRect.bottom
            });
        }

        frame = requestAnimationFrame(sync);
    }

    onMount(() => {
        frame = requestAnimationFrame(sync);
        return () => {
            cancelAnimationFrame(frame);
            videoPortalRect.set(null);
        };
    });
</script>

<div bind:this={wrapper} class="w-full h-full bg-black/40 rounded-xl shadow-inner">
    <!-- Empty Hole -->
</div>
