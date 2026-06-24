// utils/time.js
export function timeToMinutes(timeStr) {
	if (!timeStr) return 0;
	const [h, m] = timeStr.split(':').map(Number);
	return h * 60 + m;
}

export function isOverlapping(itemA, itemB) {
	const startA = timeToMinutes(itemA.start_time);
	// const endA = timeToMinutes(itemA.end_time);
	const endA = startA + Math.floor(itemA.total_duration / 60);
	const startB = timeToMinutes(itemB.start_time);
	//const endB = timeToMinutes(itemB.end_time);
	const endB = startB + Math.floor(itemB.total_duration / 60);

	// Standard overlap logic: (StartA < EndB) AND (EndA > StartB)
	return startA < endB && endA > startB;
}

export function formatPostTime(date, now=Date.now()) {

	if (typeof date == 'string')
		date = new Date(date.replace(' ', 'T') + 'Z');

	const diffMs = now - date;

	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;

	if (diffMs < minute) {
		return 'Just now';
	}

	if (diffMs < hour) {
		const mins = Math.floor(diffMs / minute);
		return `${mins} min ago`;
	}

	if (diffMs < day) {
		const hours = Math.floor(diffMs / hour);
		return `${hours}h ago`;
	}

	if (diffMs < 7 * day) {
		const days = Math.floor(diffMs / day);

		if (days === 1) {
			return 'Yesterday';
		}

		return `${days} days ago`;
	}

	const sameYear = new Date(now).getFullYear() === date.getFullYear();

	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		...(sameYear ? {} : { year: 'numeric' })
	});
}