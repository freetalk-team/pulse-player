
const kDay = 24 * 60 * 60;
const kLocalOffset = new Date().getTimezoneOffset() * 60;

Date.prototype.toLocalDateString = function(locale='en-GB', opt={ weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) {
	switch (locale) {
		case 'bg': {

			let s = '';


			if (opt.weekday) {
				const kWeekday = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
				const i = this.getDay();

				s += opt.weekday == 'short' ? (kWeekday[i].slice(3) + '.') : kWeekday[i]; 
				s += ' ';
			}

			if (opt.day) {
				s += this.getDate().toString();
				s += ' ';
			}

			if (opt.month) {
				if (options.month == 'numeric') {

				} else {

					const kMonth = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември' ];

					const i = this.getMonth();
					const month = kMonth[i];

					s += opt.month == 'short' && month.length > 4 ? (month.slice(0, 3) + '.') : month;
					s += ' ';
				}
			}

			return s.trimEnd();

		}
		break;

		default:
		return this.toLocaleDateString(locale, opt);
	}
}

Date.prototype.toLocalDateStringShort = function(locale='en-GB', opt={ weekday: 'long', month: 'short', day: 'numeric' }) {
	return this.toLocalDateString(locale, opt);
}

Date.prototype.toDateTimeString = function() {
	return this.toISOString().slice(0, 19).replace('T', ' ');
}

Date.prototype.seconds = function() {
	return Date.toSeconds(this.getTime());
}

Date.prototype.age = function(d=new Date) {
	return d.getFullYear() - this.getFullYear();
}

Date.seconds = function(align=1) { 
	const now = new Date().seconds();
	return Math.floor(now / align) * align;
}

Date.toSeconds = function(ts=new Date) {
	if (typeof ts == 'string') 
		ts = Date.parse(ts);

	if (ts instanceof Date)
		ts = ts.getTime();

	return Math.floor(ts / 1000);
}

Date.fromSeconds = function(ts) {
	return new Date(ts * 1000);
}

Date.daysToSeconds = function(days) { return days * 24 * 60 * 60; } 
Date.secondsToString = function(sec) { return new Date(sec*1000).toISOString(); }

Date.prototype.offsetFrom = function(ts=Date.now(), suffix='') {

	const s = Math.floor((ts - this.getTime()) / 1000);

	let i, t;

	if (s < 3600) {

		// offset in minutes

		i = Math.floor( (s + 40) / 60);
		t = i == 0 ? 'now' : `${i} min`;


	} 

	else if (s < 86400) {
		// offset in hours

		i = Math.floor(s / 3600);
		t =  `${i} h`;
	}

	else if (s < 604800) {
		// offset in days week scope
		i = Math.floor(s / 86400);
		t =  `${i} d`;
	}
	else {
		suffix = null;
		t = this.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	if (suffix)
		t += ' ' + suffix;

	return t;
}

Date.timeElapsed = function(ts, from=Date.now()) {

	if (typeof ts == 'string' && !ts.endsWith('Z'))
		ts += 'Z';

	const d = new Date(ts);
	return d.offsetFrom(from);
}

Date.timeElapsedLong = function(ts, from=Date.now()) {
	const d = new Date(ts);
	return d.offsetFrom(from, 'ago');
}

Date.secondsElapsed = function(ts=Date.seconds(), from=Date.now()) { 
	return Date.timeElapsed(ts * 1000, from); 
} 

Date.prototype.formatTimeDate = function() {
	return `${('0' + this.getHours()).slice(-2)}:${("0" + this.getMinutes()).slice(-2)} ${this.toLocaleString('default', { month: 'short' })} ${('0' + this.getDate()).slice(-2)}`;
}

Date.formatTimeDate = function(ts=Date.seconds()) {
	const d = getDate(ts);
	return d.formatTimeDate();
}

Date.formatDate = function(ts=Date.seconds()) {
	const d = getDate(ts);
	return d.toDateString();
}

Date.formatDateMonth = function(ts=Date.seconds()) {
	const d = getDate(ts);
	return d.toLocaleDateString('en', { month: 'short', year: 'numeric' });
}

Date.formatDateShort = function(ts=Date.seconds()) {
	const d = getDate(ts);
	return d.toLocalDateStringShort('en');
}

Date.formatDateShorter = function(ts=Date.seconds()) {
	const d = getDate(ts);
	return d.toLocalDateStringShort('en', { month: 'short', day: 'numeric' });
}

Date.todayUTC = function(ts=new Date) {

	if (typeof ts == 'number')
		ts = new Date(ts * 1000);

	const t = ts.setUTCHours(0, 0, 0, 0);

	return Date.toSeconds(t);
}

Date.today = function(ts=new Date) {

	if (typeof ts == 'number')
		ts = new Date(ts * 1000);

	const t = ts.setHours(0, 0, 0, 0);

	return Date.toSeconds(t);
}

Date.dayStartSeconds = function(now=Date.seconds(), dayOffset=0) {
	const offset = new Date().getTimezoneOffset() * 60;
	const ts = Math.floor(now / kDay) * kDay + dayOffset*kDay + offset;
	return ts;
}

Date.tomorrowSeconds = function() {
	return Date.dayStartSeconds(Date.seconds(), 1);
}

Date.days = function(d, now=Date.now()) {
	const ts = now + d * 24 * 3600 * 1000;
	return new Date(ts);
}

Date.timeout = function(sec) {

	if (typeof sec == 'number')
		return sec * 1000;

	let d;

	if (sec instanceof Date)
		d = sec;
	else {
		let m = sec.match(/^(\d+)(d|h|m)$/);
		if (m) {
			const s = { m: 60, h: 3600, d: 86400 };
			return parseInt(m[1]) * s[m[2]] * 1000;
		}

		d = new Date(sec);
	}

	return d.getTime();	
}

Date.isToday = function(d) {
	if (typeof d == 'string')
		d = new Date(d);

	return d.toDateString() === new Date().toDateString();
}

function getDate(ts) {
	return ts instanceof Date ? ts 
	: (typeof ts == 'string' ? new Date(ts) : new Date(ts * 1000));
}
