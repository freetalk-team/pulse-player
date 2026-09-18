<script>

import { onMount } from "svelte";
import { slide, fade } from 'svelte/transition';

import { sleep } from "../../../utils/sleep";
import { scrollHover, tooltip } from "../../../actions";
import { formatLocationHtml } from "../../../utils/region";
import { loadRecordings, removeRecording, setRecordingActive } from "../../../stores/recordings";
import { convertUtcStringToStationTime } from "../../../stores/recordings";

import Loading from "../Loading.svelte";

let recordings = [];
let loading;

onMount(async () => {

	loading = true;

	[recordings] = await Promise.all([
		loadRecordings(),
		sleep(400)
	]);

	loading = false;

	return api.on('recording:started', station => {
		recordings = recordings.filter(i => 
			i.station_id != station.id || 
			i.repeat != 'None' || 
			i.start_time > convertUtcStringToStationTime(null, i.timezone)
		);
	});
});

function toggleRecordingStatus(rec) {
	const id = rec.id;

	recordings = recordings.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i);
	setRecordingActive(id, !rec.is_active);

	console.debug('Recording:', recordings);
}

function handleRemoveRecording(id) {
	recordings = recordings.filter(i => i.id != id);
	removeRecording(id);
}

function buildDateString(rec) {
	const date = new Date(rec.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	const startTime = rec.start_time.split(' ')[1];
	const endTime = rec.end_time.split(' ')[1];

	return `${date} ${startTime} — ${endTime}`;
}

</script>

{#if loading}
	<Loading />

{:else}

<div class="flex h-full flex-col overflow-hidden min-w-0">

	<div class="px-8">
		<div class="text-gray-500 flex items-center gap-4 py-8 text-4xl border-b border-gray-500/30">
			<i class="fa-solid fa-record-vinyl"></i>
			<h1 class="truncate font-black text-bold uppercase tracking-wider">Scheduled recordings</h1>
		</div>
			
	</div>

	<div class="flex-1 overflow-y-auto custom-scroll min-w-0"
		use:scrollHover
	>
		<div class="mx-auto min-w-0 max-w-6xl px-8 py-16 flex flex-col gap-3">

			{#if recordings.length == 0}
				<div class="w-full py-10 flex flex-col items-center justify-center">
					<span class="text-gray-700 text-xs italic">No scheduled recordings</span>
				</div>
			{:else}

				{#each recordings as rec (rec.id)}
					<div 
						out:slide={{ duration: 200 }} 
						in:fade={{ duration: 150 }} 
						class="flex items-center justify-between p-3.5 bg-zinc-950/40 hover:bg-zinc-950/70 border border-zinc-800/60 hover:border-zinc-800 rounded-xl transition-all group"
					>
						<!-- Left Column: Status Switcher & Typography Info -->
						<div class="flex items-center gap-4 min-w-0 text-left">
							<button 
								on:click={() => toggleRecordingStatus(rec)}
								use:tooltip={rec.is_active ? "Deactivate schedule" : "Activate schedule"}
								class="w-8 h-8 rounded-lg flex items-center justify-center transition-all border
									{rec.is_active 
										? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-sm' 
										: 'bg-zinc-900 border-zinc-800 text-zinc-600'}"
							>
								<i class="fa-solid {rec.is_active ? 'fa-circle-dot animate-pulse' : 'fa-circle'} text-xs"></i>
							</button>

							<div class="min-w-0 space-y-0.5">
								<div class="flex items-center gap-2">
									<span class="font-bold">{rec.station_name}</span>
									{#if rec.favicon}
										<img src="{platform.resolve(rec.favicon)}" alt="" class="w-4 h-4 object-cover" />
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<h4 class="text-xs font-bold truncate text-zinc-100 {rec.is_active ? '' : 'text-zinc-500 line-through'}">{rec.title}</h4>
									<span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 tracking-wider">
										{rec.repeat}
									</span>
								</div>
								<p class="text-[11px] text-zinc-500 truncate flex items-center gap-1">
									<i class="fa-solid fa-microphone text-[10px] opacity-60"></i> {rec.artist}
								</p>
							</div>
						</div>

						<!-- Right Column: Operational Time Stamps & Delete Action Button -->
						<div class="flex items-center gap-5 text-right flex-shrink-0">
							<div class="space-y-0.5 font-mono text-[11px]">
								{@html formatLocationHtml(rec)}
								<p class="text-zinc-300 font-semibold flex items-center gap-1.5 justify-end">
									<i class="fa-solid fa-clock text-[10px] text-zinc-600"></i> {buildDateString(rec)}
								</p>
								<p class="text-[9px] text-zinc-600 uppercase tracking-tight font-sans font-medium">Capture Interval Window</p>
							</div>

							<button 
								on:click={() => handleRemoveRecording(rec.id)}
								use:tooltip={"Remove"}
								class="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-800/40 hover:border-red-500/30 hover:bg-red-950/10 text-zinc-500 hover:text-red-400 transition-colors"
							>
								<i class="fa-solid fa-trash-can text-xs"></i>
							</button>
						</div>
					</div>
				{/each}
			{/if}
		</div>

	</div>

</div>

{/if}