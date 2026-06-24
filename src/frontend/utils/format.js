export function formatDuration(seconds) {
	const min = Math.floor(seconds / 60);
	const sec = seconds % 60;
	return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function formatTime(seconds) {
	const hours = Math.floor(seconds / 3600);
	const min = Math.floor((seconds % 3600) / 60);

	let duration = '';

	if (hours > 0) {
		duration += `${hours}h `;

		if (min > 0)
			duration += `${min}m`;
	}
	else {
		duration += `${min}m`;
	}

	return duration;
}

export function capitlizeFirstLetter(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDescription(track) {
	if (track.artist && track.album)
		return `${track.artist} • ${track.album}`;

	return track.artist || track.album || 'Unknown';
}

export function formatDescriptionHtml(track) {

	const artist = track.artist;
	
	let album = track.album || '';

	if (track.year)
		album += ` (${track.year})`;

	if (artist && album)
		return `${artist} • <span class="italic">${album}</span>`;

	return track.artist || track.album || 'Unknown';
}

