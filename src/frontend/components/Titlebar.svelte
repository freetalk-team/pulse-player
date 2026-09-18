<script>

import pkg from '@pkg';

import { isDark } from '../stores/ui';

function toggleTheme() {
	isDark.update(dark => !dark);
}

function handleAction(cmd) {
	if (isElectron) {
		api.ipc.send(`window:${cmd}`);
	}
}

</script>

<!-- The Bar: Using a subtle gradient and top highlight for 3D effect -->
<div 
	class="titlebar"
	style="-webkit-app-region: drag">
  
	<!-- Left: Branding with a slight 'recessed' text effect -->
	<div class="flex items-center gap-2 pl-4 opacity-60">
		<i class="fa-solid fa-bolt-lightning text-[10px] text-pulse-accent drop-shadow-[0_0_5px_rgba(29,185,84,0.5)]"></i>
		<span class="text-[9px] uppercase font-black tracking-[0.25em]">{pkg.appname}</span>
		<!-- <span class="flex items-center gap-1 ml-4 text-[12px] text-pulse-white/60">
			<i class="fa-brands fa-ubuntu"></i>
			<i class="fa-brands fa-windows"></i>
			<i class="fa-brands fa-apple"></i>
			<i class="fa-brands fa-google-play"></i>
			<i class="fa-brands fa-app-store-ios"></i>
		</span> -->
	</div>

	<!-- Right: Controls with 'no-drag' -->
	<div class="flex items-center h-full" style="-webkit-app-region: no-drag">

		<button on:click={toggleTheme} 
			class="title-btn hover:text-pulse-accent"
			title="{$isDark ? 'Toggle light' : 'Toggle dark'}"
		>
			<i class="fa-solid {$isDark ? 'fa-sun' : 'fa-moon'} text-[12px]"></i>
		</button>

		<span class="text-[10px] font-mono opacity-50 mr-3">v{pkg.version}</span>

		{#if __PLATFORM__ === 'desktop'}
			<button on:click={() => handleAction('min')} 
				class="title-btn hover:bg-pulse-white/10"
				title="Minimize"
			>
				<i class="fa-solid fa-minus text-[9px]"></i>
			</button>
			<button on:click={() => handleAction('max')} 
				class="title-btn hover:bg-pulse-white/10"
				title="Maximize"
			>
				<i class="fa-regular fa-square text-[9px]"></i>
			</button>
			<button on:click={() => handleAction('close')} 
				class="title-btn hover:bg-red-500/80 group"
				title="Close"
			>
				<i class="fa-solid fa-xmark text-[10px] group-hover:scale-110 transition-transform"></i>
			</button>
		{/if}
	</div>
</div>

<style>

@reference "../assets/main.css";

.title-btn {
	@apply w-10 h-full flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-pulse-white;
}

/* Dark theme */
.titlebar {
	@apply relative flex items-center justify-between h-8 min-h-[32px] flex-shrink-0 z-100 select-none
		bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),rgba(255,255,255,0.02))]
		backdrop-blur-[10px]
		border-t
		border-b
		border-t-[rgba(255,255,255,0.15)]
		border-b-[rgba(255,255,255,0.05)]
		shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_4px_10px_rgba(0,0,0,0.6)];
}

.titlebar::before {
	content: "";
	@apply absolute inset-0
		bg-[linear-gradient(to_bottom,rgba(255,255,255,0.25),transparent_40%)]
		pointer-events-none;
}

.titlebar::after {
	content: "";
	@apply absolute left-0 right-0 -bottom-px h-px
		bg-[rgba(0,0,0,0.35)];
}

/* Light theme */
:global(.light-theme) .titlebar {
	@apply bg-[linear-gradient(to_bottom,#f2f2f2,#acacac)]
		border-t-[rgba(255,255,255,0.8)]
		border-b-[rgba(0,0,0,0.18)]
		shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_4px_8px_rgba(0,0,0,0.4)];
}


</style>
