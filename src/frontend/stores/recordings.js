import { writable, get } from "svelte/store";

import { currentStation, selectedStation } from "./radio";

export const activeRecordings = writable([]);
export const stationRecordings = writable([]);


api.on('recording:started', station => {
	activeRecordings.update(list => [station, ...list]);

	const timezone = getTimezoneOffset();
	const currentId = get(currentStation)?.id || get(selectedStation)?.id;

	if (currentId == station.id) {
		const now = convertUtcStringToStationTime(null, timezone);

		stationRecordings.update(recordings => recordings.filter(i => i.repeat != 'None' || i.start_time > now));
	}
});

api.on('recording:ended', station => activeRecordings.update(list => list.filter(i => i.id != station.id)));


currentStation.subscribe(updateStationRecordings);
selectedStation.subscribe(updateStationRecordings);


export function startRecording(station) {
	console.debug('Start recording:', station);
	
	return api.startRecording(station.id);
}

export function stopRecording(station) {
	api.stopRecording(station.id);
}

export async function addRecording(station, schedule) {
	const localtz = getTimezoneOffset();
	const timezone = schedule.stationLocalTime ? station.timezone : localtz; 
	const rec = buildRecording(schedule, timezone);

	rec.station_id = station.id;

	const id = await api.addRecording(rec);

	if (!id) return;

	rec.id = id;
	rec.start_time = convertUtcStringToStationTime(rec.start_time, localtz);
	rec.end_time = convertUtcStringToStationTime(rec.end_time, localtz);
	rec.is_active = true;

	stationRecordings.update(recordings => [rec, ...recordings]);

	return rec;

	
}

export async function removeRecording(recordingId) {
	await api.removeRecording(recordingId);

	stationRecordings.update(recordings => recordings.filter(i => i.id != recordingId));
}

export async function setRecordingActive(recordingId, active) {
	await api.setRecordingActive(recordingId, active);

	stationRecordings.update(recordings => recordings.map(i => i.id === recordingId ? { ...i, is_active: active } : i));
}

export async function loadRecordings(station) {
	const timezone = getTimezoneOffset();
	const recordings = await api.loadRecordings(station?.id);

	if (station) {
		for (const rec of recordings) {
			rec.start_time = convertUtcStringToStationTime(rec.start_time, timezone);
			rec.end_time = convertUtcStringToStationTime(rec.end_time, timezone);
		}
	}
	else {
		for (const rec of recordings) {
			rec.start_time = convertUtcStringToStationTime(rec.start_time, timezone);
			rec.end_time = convertUtcStringToStationTime(rec.end_time, timezone);
		}
	}

	console.debug('Loaded recordings:', recordings);

	return recordings;
}

function getTimezoneOffset() {
	const offset = -new Date().getTimezoneOffset();

	const sign = offset >= 0 ? '+' : '-';
	const hours = Math.floor(Math.abs(offset) / 60);
	const minutes = Math.abs(offset) % 60;

	return `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function buildRecording({ startTime, endTime, date, title, artist, repeat }, timezone) {

	const startUtc = convertStationTimeToUtcString(date, startTime, timezone);
	
	// 2. Compute absolute end time anchor string, checking for next-day crossovers
	let endUtc;
	if (endTime < startTime) {
		// Next-day crossover execution rule matched (e.g. 23:30 to 01:30)
		// Dynamically increment the local calendar day parameter forward by 1 day
		const [y, m, d] = date.split('-').map(Number);
		const nextDay = new Date(y, m - 1, d);
		nextDay.setDate(nextDay.getDate() + 1);

		const tomorrowDateString = nextDay.toISOString().split('T')[0];
		endUtc = convertStationTimeToUtcString(tomorrowDateString, endTime, timezone);
	} else {
		// Standard timeframe window window on the exact same calendar day
		endUtc = convertStationTimeToUtcString(date, endTime, timezone);
	}

	// 3. Dispatch the calculated strings down to the Main process
	const payload = {
		title,
		artist: artist || "Unknown Stream Source",
		start_time: startUtc,
		end_time: endUtc,
		repeat
	};

	return payload;
}

function updateStationRecordings(station) {
	if (station) {
		loadRecordings(station)
			.then(recordings => stationRecordings.set(recordings))
			.catch(e => stationRecordings.set([]));
	}
}

/**
 * Converts a station's target date, time, and offset into a clean SQL UTC string.
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} timeStr - "HH:MM"
 * @param {string} tzOffsetStr - "UTC+02:00" or "UTC-05:00"
 * @returns {string} - Absolute UTC String formatted as "YYYY-MM-DD HH:MM:SS"
 */
function convertStationTimeToUtcString(dateStr, timeStr, tzOffsetStr) {
	// Strip out "UTC" characters to isolate the mathematical signature offset (e.g., "+02:00")
	let offsetModifier = tzOffsetStr.replace('UTC', '').trim();
	if (!offsetModifier || offsetModifier === 'Z') offsetModifier = '+00:00';

	// Synthesize standard ISO-8601 string representation mapping the station local target environment
	const localIsoString = `${dateStr}T${timeStr}:00${offsetModifier}`;

	// Converting via native JS Date object shifts the timestamp into pure UTC time automatically
	const utcDateObj = new Date(localIsoString);

	// Convert object representation into your required SQLite storage format: "YYYY-MM-DD HH:MM:SS"
	return utcDateObj.toISOString().replace('T', ' ').substring(0, 19);
}

export function convertUtcStringToStationTime(datetime, tz) {

	datetime = datetime
		? datetime.replace(' ', 'T')
		: new Date().toISOString().substr(0, 19);

	let offset = tz.replace('UTC', '').trim();
	if (!offset || offset === 'Z') offset = '+00:00';

	if (offset.startsWith('+')) offset = '-' + offset.substr(1);
	else offset = '+' + offset.substr(1);

	const isoString = `${datetime}${offset}`;
	const d = new Date(isoString);

	// YYYY-MM-DD HH:MM
	return d.toISOString().replace('T', ' ').substring(0, 16);
}