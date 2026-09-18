<script>

import { tooltip } from "../../../actions";
import { regionInfo } from "../../../utils/region";
import { formatTags } from "../../../utils/format";

import { currentRadio, stop } from "../../../stores/play";
import { toggleFavourite, updateStation, play } from "../../../stores/radio";
import { activeRecordings, startRecording, stopRecording, stationRecordings } from "../../../stores/recordings";

import { runPremiumAction } from "../../PremiumLockModal.svelte";
import RatingStars from "../RatingStars.svelte";
import RadioRecorderManager from "./RadioRecorderManager.svelte";
import Select from "../../ui/controls/SelectInput.svelte";
import RecordingBadge from "./RecordingBadge.svelte";

export let station;

$: isRecording = $activeRecordings.some(i => i.id == station.id);
$: isPlaying = $currentRadio?.id == station.id;

function formatCountry(station) {
	const region = station.countrycode ? regionInfo[station.countrycode] : { flag: '<i class="fa-solid fa-flag"></i>', name: 'Not specified' };
	const country = `${region.flag} <strong class="ml-2">${region.name}</strong>`;

	return `<span>${country}</span>`;
}

function formatDate(station) {

	const date = station.played_at 
		? `<strong>${typeof station.played_at == 'string' 
			? new Date(station.played_at).toLocaleString() 
			: station.played_at.toLocaleString()}</strong>`
		: '<i>never</i>';

	return `<span class="text-gray-600 font-mono tracking-wider">${date}</span>`;
}

function updateUTC(value) {
	console.debug('UTC changed:', station.id, value);
	updateStation(station.id, { timezone: value });
}

function isValidUTC(value) {
    return /^UTC(?:[+-](?:0\d|1\d|2[0-3]):[0-5]\d)?$/.test(value);
}

function togglePlay() {
	if (isPlaying) 
		stop();
	else 
		play(station);
}

function toggleRecord() {
	if (isRecording)
		stopRecording(station);
	else {
		if (!runPremiumAction('STREAM_RECORD')) return;

		startRecording(station);
	}
}

</script>

<div class="flex-1 min-w-0 auto-hide-scrollbar">
	<div class="mx-auto min-w-0 max-w-6xl px-8 py-16 space-y-6">

		<div class="flex gap-8">

			<div class="w-64 h-64 flex-shrink-0 aspect-square bg-black/40 rounded-lg shadow-2xl border border-white/10">
				{#if station.favicon}
					<img
						draggable="false"
						src="{platform.resolve(station.favicon)}"
						class="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500" 
						alt="" 
					/>
				{:else}
					<div class="w-full h-full flex items-center justify-center text-gray-800">
						<i class="fa-solid fa-radio text-8xl"></i>
					</div>
				{/if}
			</div>

			<div class="flex flex-col flex-1 overflow-hidden">
				<div class="flex items-center gap-4 rounded-xl p-4 mb-4 bg-pulse-white/5">
					<h1 class="flex-1 font-black text-bold text-4xl truncate">{station.name}</h1>
					{#if isRecording}
						<RecordingBadge />
					{/if}
					<div class="flex items-center gap-2">
						<button class="action-btn" 
							on:click={() => toggleFavourite(station)}
							use:tooltip={"Favourite"}
						>
							<i class="{station.favourite ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart"></i>
						</button>
						<button class="action-btn" 
							on:click={toggleRecord}
							use:tooltip={isRecording ? "Stop" : "Record"}
						>
							<i class="fa-solid fa-compact-disc {isRecording ? 'text-red-500 animate-spin [animation-duration:3s]' : 'text-pulse-accent'}"></i>
						</button>
						<button class="action-btn" 
							on:click={togglePlay}
							use:tooltip={isPlaying ? "Stop" : "Play"}
						>
							<i class="fa-solid {isPlaying ? 'fa-stop text-red-500' : 'fa-play text-pulse-accent'}"></i>
						</button>
					</div>
				</div>

				<div class="w-full space-y-2 mb-4 select-none">
    
					<!-- Row Item 1: Country Data Entry -->
					<div class="row group">
						<span class="label">Country</span>
						<div class="value">
							{@html formatCountry(station)}
						</div>
					</div>

					<!-- Row Item 2: State Data Entry -->
					<div class="row group">
						<span class="label">State</span>
						<div class="value">
							{station.state || '—'}
						</div>
					</div>

					<!-- Row Item 3: Language Data Entry -->
					<div class="row group">
						<span class="label">Language</span>
						<div class="value">
							{station.language || '—'}
						</div>
					</div>

					<div class="row group">
						<span class="label">Homepage</span>
						<div class="value">
							<a href="{station.homepage}" target="_blank" class="link">
								Goto website
							</a>
						</div>
					</div>

					<div class="row group">
						<span class="label">Rating</span>
						<div class="value">
							<RatingStars rating={station.rating} />
						</div>
					</div>

					<div class="row group">
						<span class="label">Last played</span>
						<div class="value">
							{@html formatDate(station)}
						</div>
					</div>

					<div class="row group">
						<span class="label">Timezone</span>
						<div class="max-w-[150px]">
							<Select 
								items={regionInfo[station.countrycode]?.timezones || []} 
								value={station.timezone || 'UTC'} 
								onChange={updateUTC}
								validate={isValidUTC}  
							/>
						</div>
					</div>

					<div class="row group">
						<span class="label">Tags</span>
						<div class="tags">
							{formatTags(station.tags || '')}
						</div>
					</div>
				</div>

			</div>
		</div>

		<RadioRecorderManager {station} recordings={$stationRecordings} />
	</div>

</div>

<style>

@reference "../../../assets/main.css";

.action-btn {
	@apply text-3xl text-pulse-white transition-all active:scale-95 drop-shadow-lg;
}

.row {
	@apply grid grid-cols-[12rem_1fr] items-center py-1 transition-colors;
}

.row > .label {
	@apply text-sm font-bold text-gray-500 group-hover:text-pulse-accent text-left;
}

.row > .value {
	@apply text-sm font-medium text-zinc-500 text-left min-w-0 truncate;
}

.row > .tags {
	@apply text-sm text-pulse-accent uppercase tracking-wider min-w-0 line-clamp-3;
}

</style>