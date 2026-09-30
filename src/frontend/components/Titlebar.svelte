<script>

import pkg from '@pkg';

import { isDark } from '../stores/ui';

let updateReady = $state(false);
let updateVersion = $state(null);

function toggleTheme() {
	isDark.update(dark => !dark);
}

function handleAction(cmd) {
	api.ipc.send(`window:${cmd}`);
}

api.on('update-downloaded', (data) => {
	updateVersion = data.version;
	updateReady = true;
});

function installUpdate() {
	api.installUpdate();
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
	</div>

	<!-- Right: Controls with 'no-drag' -->
	<div class="flex items-center h-full" style="-webkit-app-region: no-drag">

		<button onclick={toggleTheme} 
			class="title-btn hover:text-pulse-accent"
			title="{$isDark ? 'Toggle light' : 'Toggle dark'}"
		>
			<i class="fa-solid {$isDark ? 'fa-sun' : 'fa-moon'} text-[12px]"></i>
		</button>

		{#if updateReady}
			<button
				class="mr-3 flex items-center gap-1.5 text-[10px] rounded-lg px-3 py-0.5 text-white transition-all bg-blue-600 hover:bg-blue-500 hover:shadow-sm"

				title={`Update to v${updateVersion} is ready`}
				onclick={installUpdate}
			>
				<i class="fa-solid fa-arrow-rotate-right text-[8px]"></i>
				<span class="tracking-wider font-bold">UPDATE</span>
			</button>
		{/if}

		<span class="text-[10px] font-mono opacity-50 mr-3">v{pkg.version}</span>

		{#if __PLATFORM__ === 'desktop'}
			<button onclick={() => handleAction('min')} 
				class="title-btn hover:bg-pulse-white/10"
				title="Minimize"
			>
				<i class="fa-solid fa-minus text-[9px]"></i>
			</button>
			<button onclick={() => handleAction('max')} 
				class="title-btn hover:bg-pulse-white/10"
				title="Maximize"
			>
				<i class="fa-regular fa-square text-[9px]"></i>
			</button>
			<button onclick={() => handleAction('close')} 
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
	@apply relative flex items-center justify-between h-8 min-h-[32px] flex-shrink-0 z-100 select-none backdrop-blur-[10px] border-t border-b
		bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),rgba(255,255,255,0.02))]
		border-t-[rgba(255,255,255,0.15)]
		border-b-[rgba(255,255,255,0.05)]
		shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_4px_10px_rgba(0,0,0,0.6)]
		light:bg-[linear-gradient(to_bottom,#f2f2f2,#acacac)]
		light:border-t-[rgba(255,255,255,0.8)]
		light:border-b-[rgba(0,0,0,0.18)]
		light:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_4px_8px_rgba(0,0,0,0.4)]
		;
}

.titlebar::before {
	content: "";
	@apply absolute inset-0 pointer-events-none
		bg-[linear-gradient(to_bottom,rgba(255,255,255,0.25),transparent_40%)]
		;
}

.titlebar::after {
	content: "";
	@apply absolute left-0 right-0 -bottom-px h-px
		bg-[rgba(0,0,0,0.35)];
}

</style>
