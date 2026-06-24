<script>

import { isElectron } from '../utils/env';

import pkg from '@pkg';

function handleAction(cmd) {
	if (isElectron) {
		api.ipc.send(`window:${cmd}`);
	}
}

let isDark = true; // Default to dark

function toggleTheme() {
	isDark = !isDark;
	document.documentElement.classList.toggle('light-theme', !isDark);
}

</script>

<!-- The Bar: Using a subtle gradient and top highlight for 3D effect -->
<div 
	class="title-bar flex items-center justify-between h-8 min-h-[32px] flex-shrink-0 z-100 select-none"
	style="-webkit-app-region: drag">
  
	<!-- Left: Branding with a slight 'recessed' text effect -->
	<div class="flex items-center gap-2 pl-4 opacity-60">
		<i class="fa-solid fa-bolt-lightning text-[10px] text-pulse-accent drop-shadow-[0_0_5px_rgba(29,185,84,0.5)]"></i>
		<span class="text-[9px] uppercase font-black tracking-[0.25em]">Pulse Player</span>
	</div>

	<!-- Right: Controls with 'no-drag' -->
	<div class="flex items-center h-full" style="-webkit-app-region: no-drag">

		<button on:click={toggleTheme} 
			class="title-btn hover:text-pulse-accent"
			title="{isDark ? 'Toggle light' : 'Toggle dark'}"
		>
			<i class="fa-solid {isDark ? 'fa-sun' : 'fa-moon'} text-[12px]"></i>
		</button>

		<span class="text-[10px] font-mono opacity-50 mr-3">v{pkg.version}</span>

		{#if isElectron}
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

.title-bar {
	position: relative;

	/* background-color: var(--titlebar-bg-base); */
	background: linear-gradient(
		to bottom,
		var(--titlebar-bg-top),
		var(--titlebar-bg-bottom)
	);

	backdrop-filter: blur(10px);
	border-bottom: 1px solid var(--titlebar-border-bottom);

	border-top: 1px solid var(--titlebar-border-top);

	box-shadow:
		inset 0 1px 0 0 var(--titlebar-highlight), /* inner highlight */
		var(--titlebar-shadow);                   /* outer shadow */
}

.title-bar::before {
	content: "";
	position: absolute;
	inset: 0;
	background: linear-gradient(
		to bottom,
		rgba(255,255,255,0.25),
		transparent 40%
	);
	pointer-events: none;
}

.title-bar::after {
	content: "";
	position: absolute;
	left: 0;
	right: 0;
	bottom: -1px;
	height: 1px;
	background: rgba(0,0,0,0.35);
}

.theme-light .title-bar::before {
	background: linear-gradient(
		to bottom,
		rgba(255,255,255,0.6),
		transparent 45%
	);
}

.theme-light .title-bar::after {
	background: rgba(0,0,0,0.08);
}


</style>
