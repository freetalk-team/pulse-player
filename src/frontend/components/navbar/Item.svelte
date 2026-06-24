<script>

import Tooltip from "../ui/Tooltip.svelte";

import { capitlizeFirstLetter } from "../../utils/format";

export let name;
export let icon;
export let active = false;
export let onClick;

function handleClick() {
	if (active) return;

	onClick(name);
}

</script>

<button 
	class="nav-item relative group {active ? 'active' : ''}" 
	on:click={() => onClick(name)}
>
	<i class="fa-solid {icon}"></i>
	<Tooltip title={capitlizeFirstLetter(name)} />
</button>

<style>

@reference "../../assets/main.css";

.nav-item {
    /* Ensure the base item has a defined stacking position */
    @apply relative text-[1.3rem] text-gray-500 transition-all duration-300 ease-out;
    z-index: 10;
}

.nav-item:hover {
    @apply scale-110 text-pulse-white/80;
    /* Lift it slightly on hover so tooltip clears others */
    z-index: 50; 
}

.nav-item.active {
    @apply scale-110 text-pulse-accent;
    filter: drop-shadow(0 0 10px rgba(29, 185, 84, 0.6));
    /* High priority for active item */
    z-index: 20; 
}

/* If you hover the active item, it needs to go back to 50 */
.nav-item.active:hover {
    z-index: 50;
}

</style>