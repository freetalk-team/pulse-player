<script>

import { Colors } from "../ui/icons";

export let item;

const [icon, iconColor] = item.icon.split(' ');
const previews = item.cover_path ? item.cover_path.split(',') : [];

</script>

{#each Array(4) as _, i}
	<div class="bg-white/5 flex items-center justify-center">
		{#if previews[i]}
			<img src="{platform.resolve(previews[i])}" class="w-full h-full object-cover" alt="" />
		{:else}
			<i class="fa-solid {icon} opacity-10 text-xl" style:color={Colors[iconColor || 'slate']}></i>
		{/if}
	</div>
{/each}