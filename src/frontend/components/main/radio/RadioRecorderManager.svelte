

<script>

import { slide, fade } from 'svelte/transition';

import { tooltip } from '../../../actions';
import { addRecording, removeRecording, setRecordingActive } from '../../../stores/recordings';

import { runPremiumAction } from '../../PremiumLockModal.svelte';
import TimePicker from '../../ui/controls/TimePickerInput.svelte';
import DatePicker from '../../ui/controls/DatePicker.svelte';

export let station;
export let recordings = [];
// List of existing recording schedules (Could be driven by a store or SQLite)


// Form Binding variables for new entries
let newTitle = "";
let newArtist = "";
let newStartTime = "10:00";
let newEndTime = "";
let newRepeat = "None"; // Default fallback option
let newStationLocalTime = false;
let selectedActiveDate = new Date().toISOString().split('T')[0]; // Defaults to today

// Toggle management for the creation drawer panel
let isDrawerOpen = false;

// Hardcoded repeat options matching your customized layout profile requirements
const repeatOptions = [
	{ id: 'None', label: 'Once', icon: 'fa-solid fa-calendar-xmark' },
	{ id: 'Daily', label: 'Daily', icon: 'fa-solid fa-arrows-spin' },
	{ id: 'Weekly', label: 'Weekly', icon: 'fa-solid fa-calendar-days' }
];

// Reactive input validation rule constraints
$: isFormValid = newTitle.trim() !== "" && newStartTime !== "" && newEndTime !== "";

function resetForm() {
	newTitle = "";
	newArtist = "";
	newStartTime = "";
	newEndTime = "";
	newRepeat = "None";
	newStationLocalTime = false;
	isDrawerOpen = false;
}

function openDrawer() {
	if (!isDrawerOpen && !runPremiumAction('STREAM_RECORD'))
		return;

	isDrawerOpen = !isDrawerOpen;
}

async function handleAddRecording() {
	if (!isFormValid) return;

	const title = newTitle.trim();
	const artist = newArtist.trim();

	const newRecord = {
		title,
		artist: artist || station.name,
		startTime: newStartTime,
		endTime: newEndTime,
		date: selectedActiveDate,
		repeat: newRepeat,
		stationLocalTime: newStationLocalTime
	};

	console.debug('Adding recording:', selectedActiveDate, newStartTime);

	await addRecording(station, newRecord);

	resetForm();
}


function shiftDate(daysStep) {
	// Parse date explicitly using local time components to avoid UTC midnight rollover bugs
	const [year, month, day] = selectedActiveDate.split('-').map(Number);
	const currentTarget = new Date(year, month - 1, day);
	
	currentTarget.setDate(currentTarget.getDate() + daysStep);
	
	const y = currentTarget.getFullYear();
	const m = (currentTarget.getMonth() + 1).toString().padStart(2, '0');
	const d = currentTarget.getDate().toString().padStart(2, '0');
	
	selectedActiveDate = `${y}-${m}-${d}`;
}

function buildDateString(rec) {
	const date = new Date(rec.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	const startTime = rec.start_time.split(' ')[1];
	const endTime = rec.end_time.split(' ')[1];

	return `${date} ${startTime} — ${endTime}`;
}

</script>

<div class="container">

	<!-- Top Action Toolbar Area Header -->
	<div class="header">
		<div class="flex items-center gap-3 min-w-0">
			<div class="w-9 h-9 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 flex-shrink-0">
				<i class="fa-solid fa-radio text-base"></i>
			</div>
			<div class="text-left min-w-0">
				<h2 class="text-sm font-bold tracking-tight text-pulse-white truncate">Stream Schedule Manager</h2>
				<p class="text-[11px] text-zinc-500 truncate">Record and catalogue local online frequencies automatically.</p>
			</div>
		</div>

		<!-- Right Side Control Operations Cluster Group -->
		<div class="flex items-center gap-3 flex-shrink-0">
			
			<!-- Interactive Inline Day Stepper Control Group Layout -->
			<div class="date-picker">
				<!-- Step Day Backward Button -->
				<button 
					type="button"
					on:click={() => shiftDate(-1)}
					use:tooltip={"Previous day"}
				>
					<i class="fa-solid fa-chevron-left text-[10px]"></i>
				</button>

				<!-- Your Auto-Placement Date Picker Component (Note: border removed for inside group look) -->
				<DatePicker bind:value={selectedActiveDate} class="border-none bg-transparent" />

				<!-- Step Day Forward Button -->
				<button 
					type="button"
					on:click={() => shiftDate(1)}
					use:tooltip={"Next day"}
				>
					<i class="fa-solid fa-chevron-right text-[10px]"></i>
				</button>
			</div>

			<!-- Main Action Drawer Trigger Toggle Button -->
			<button 
				on:click={openDrawer}
				class="primary px-3 py-1.5 h-[36px] flex items-center gap-1.5"
			>
				<i class="fa-solid {isDrawerOpen ? 'fa-minus' : 'fa-plus'}"></i>
				<span>{isDrawerOpen ? 'Cancel' : 'Add Recording'}</span>
			</button>
		</div>
	</div>
    
  

    <!-- Hidden Collapse Content Input Box Panel -->
    {#if isDrawerOpen}
        <div transition:slide={{ duration: 250 }} class="drawer">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Field 1: Track Broadcast Title -->
                <div class="flex flex-col gap-1.5 text-left">
                    <label for="rec-title">Recording Title *</label>
                    <input id="rec-title" type="text" bind:value={newTitle} placeholder="e.g., Weekly Synthwave Hitlist" class="form-input" />
                </div>
                
                <!-- Field 2: Anchor Artist Tracker -->
                <div class="flex flex-col gap-1.5 text-left">
                    <label for="rec-artist">Target Artist / Station</label>
                    <input id="rec-artist" type="text" bind:value={newArtist} placeholder="e.g., Proton Radio Stream" class="form-input" />
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <!-- Field 3: Start Operational Time -->
                <div class="flex flex-col gap-1.5 text-left">
                    <label for="rec-start">Start Time *</label>
                    <!-- <input id="rec-start" type="time" bind:value={newStartTime} class="form-input font-mono" /> -->
					<TimePicker id="rec-start" bind:value={newStartTime} />
                </div>

                <!-- Field 4: End Operational Time -->
                <div class="flex flex-col gap-1.5 text-left">
                    <label for="rec-end">End Time *</label>
                    <!-- <input id="rec-end" type="time" bind:value={newEndTime} class="form-input font-mono" /> -->
					<TimePicker id="rec-end" bind:value={newEndTime} />
                </div>

				<div class="flex flex-col gap-1.5 text-left">
                    <label>Local time</label>
                    <div class="repeat relative flex items-center border h-[38px] p-0.5 gap-0.5 overflow-hidden w-full">
						<button type="button"
							on:click={() => newStationLocalTime = false}
							class="tab"
							class:selected={!newStationLocalTime}
						>
							<i class="fa-solid fa-clock" class:opacity-70={newStationLocalTime}></i>
							<span class="truncate">Local</span>
						</button>
						<button type="button"
							on:click={() => newStationLocalTime = true}
							class="tab"
							class:selected={newStationLocalTime}
						>
							<i class="fa-regular fa-clock" class:opacity-70={!newStationLocalTime}></i>
							<span class="truncate">Station</span>
						</button>
					</div>
                </div>

                <!-- Field 5: Segmented Horizontal Radio Selection -->
                <div class="flex flex-col gap-1.5 text-left">
                    <label>Repeat Profile</label>
                    <div class="repeat relative flex items-center border h-[38px] p-0.5 gap-0.5 overflow-hidden w-full">
                        {#each repeatOptions as opt}
                            <button type="button"
                                on:click={() => newRepeat = opt.id}
                                class="tab"
								class:selected={newRepeat === opt.id}
                            >
                                <i class={opt.icon} class:opacity-70={newRepeat !== opt.id}></i>
                                <span class="truncate">{opt.label}</span>
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Panel Confirm Task Action Buttons -->
            <div class="flex justify-end gap-2 pt-2 border-t border-zinc-800/40">
                <button on:click={resetForm} class="px-3 py-1.5 discard">Discard</button>
                <button 
                    disabled={!isFormValid} 
                    on:click={handleAddRecording} 
                    class="primary px-4 py-1.5"
                >
                    Save Task Schedule
                </button>
            </div>
        </div>
    {/if}

    <!-- Main Output Monitor Matrix Grid Container -->
    <div class="main custom-scrollbar">
        {#if recordings.length === 0}
            <div transition:fade class="h-44 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-zinc-800 rounded-xl px-4">
                <i class="fa-solid fa-folder-open text-2xl text-zinc-700"></i>
                <div>
                    <p class="text-xs font-semibold text-zinc-400">No scheduled streams configured</p>
                    <p class="text-[11px] text-zinc-600 mt-0.5">Click the "Add Recording" command block option top right to append tracks.</p>
                </div>
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
							on:click={() => setRecordingActive(rec.id, !rec.is_active)}
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
							<p class="text-zinc-300 font-semibold flex items-center gap-1.5 justify-end">
								<i class="fa-solid fa-clock text-[10px] text-zinc-600"></i> {buildDateString(rec)}
							</p>
							<p class="text-[9px] text-zinc-600 uppercase tracking-tight font-sans font-medium">Capture Interval Window</p>
						</div>

						<button 
							on:click={() => removeRecording(rec.id)}
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

<style>

@reference "../../../assets/main.css";

label {
	@apply text-[10px] font-bold uppercase tracking-wider text-zinc-500;
}

button.tab {
	@apply flex-1 h-full flex items-center justify-center gap-1.5 text-[11px] px-1;
}

.date-picker {
	@apply flex items-center bg-zinc-950 border border-zinc-800/60 p-0.5 rounded-xl gap-0.5 shadow-inner;
}

:global(.light-theme) .date-picker {
	@apply bg-zinc-200 border-zinc-400/60;
}

.date-picker button {
	@apply w-8 h-8 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 active:text-pulse-white transition-colors flex items-center justify-center focus:outline-none;
}

:global(.light-theme) .date-picker button {
	@apply hover:bg-zinc-300 text-zinc-800 hover:text-zinc-500;
}


/* Local Atomic form helper elements matched to base app layouts */
.form-input {
	@apply w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500 transition-colors h-[38px];
}

:global(.light-theme) .form-input {
	@apply bg-zinc-300/30 text-zinc-950 placeholder:text-zinc-600;
}

/* Input overrides specifically targeting chromium date/time picker modules */
.form-input::-webkit-calendar-picker-indicator {
	@apply invert opacity-40 hover:opacity-70 cursor-pointer;
}/* Clean scroll track profile specifications */

.custom-scrollbar::-webkit-scrollbar {
	width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
	@apply bg-zinc-800 rounded-full hover:bg-zinc-700;
}

.container {
	@apply w-full h-full flex flex-col border rounded-2xl shadow-xl overflow-hidden min-h-0 select-none
		bg-zinc-900/60 border-zinc-800 text-zinc-100
		;
}

:global(.light-theme) .container {
	@apply bg-zinc-100/10 border-zinc-600/60 text-zinc-400;
}

.container .header {
	@apply p-5 border-b border-zinc-800/80 flex items-center justify-between
		bg-zinc-950/60 border-zinc-800/80
		;
}

:global(.light-theme) .container .header {
	@apply bg-zinc-300/40 border-zinc-700/60;
}

.container .main {
	@apply flex-1 overflow-y-auto p-5 space-y-2.5 min-h-0 bg-zinc-900/30;
}

:global(.light-theme) .container .main {
	@apply bg-zinc-200/30;
}

.container .drawer {
	@apply bg-zinc-950/30 border-b border-zinc-800/60 p-5 space-y-4;
}

:global(.light-theme) .container .drawer {
	@apply bg-zinc-400/30;
}
.repeat {
	@apply bg-zinc-950 border border-zinc-800 shadow-inner rounded-xl;
}

:global(.light-theme) .repeat {
	@apply bg-zinc-300 border-zinc-500;
}

.repeat > button {
	@apply text-zinc-400 hover:text-zinc-200 font-medium rounded-lg transition-all focus:outline-none;
}

:global(.light-theme) .repeat > button {
	@apply text-zinc-700 hover:text-zinc-500;
}

.repeat > button.selected {
	@apply bg-purple-600 text-pulse-white shadow-sm;
}

:global(.light-theme) .repeat > button.selected {
	@apply hover:text-zinc-700;
}

button.primary {
	@apply bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed font-semibold text-pulse-white rounded-lg text-xs transition-all shadow-md;
}

:global(.light-theme) button.primary {
	@apply disabled:bg-zinc-400 disabled:text-zinc-600;
}

button.discard {
	@apply text-xs text-zinc-400 hover:text-zinc-200 transition-colors;
}

:global(.light-theme) button.discard {
	@apply text-zinc-600 hover:text-zinc-400;
}

</style>