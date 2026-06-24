

String.prototype.hashCode = function() {
	//console.log(typeof this);
	var hash = 5381, i = this.length
	while(i)
		hash = (hash * 33) ^ this.charCodeAt(--i)

	return hash >>> 0;
}

String.prototype.hashCodeSigned = function() {
	const hash = this.hashCode();
	return hash >> 0;
}

String.prototype.hashHex = function() {
	return this.hashCode().toString(16);
}

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.toArrayBuffer = function() {
	const encoder = new TextEncoder(); // Creates a new TextEncoder instance
	return encoder.encode(this); // Encodes the string and extracts the ArrayBuffer
}

String.prototype.splitByCapital = function() {

	/*
		(?i)(?<=\b[a-z]) (?=[a-z]\b)

		Explanation:
		(?i)          # set flags for this block (case-insensitive)
		(?<=          # look behind to see if there is:
		  \b          #   the boundary between a word char (\w) and not a word char
		  [a-z]       #   any character of: 'a' to 'z'
		)             # end of look-behind
					  # ' '
		(?=           # look ahead to see if there is:
		  [a-z]       #   any character of: 'a' to 'z'
		  \b          #   the boundary between a word char (\w) and not a word char
		)             # end of look-ahead
	*/

	return this.split(/(?=[A-Z])/).join(' ')
		.replace(/(?<=\b[A-Z]) (?=[A-Z]\b)/g, '')
		;
}

String.prototype.toHex = function() {

	let r = '';

	for (let i=0; i < this.length; i++)
		r += this.charCodeAt(i).toString(16);
	
	return r;
}

String.prototype.toByteArray = function() {

	const result = [];

	for (let i = 0; i < this.length; i += 1) {
		const hi = this.charCodeAt(i);
		if (hi < 0x0080) {
			// code point range: U+0000 - U+007F
			// bytes: 0xxxxxxx
			result.push(hi);
			continue;
		}
		if (hi < 0x0800) {
			// code point range: U+0080 - U+07FF
			// bytes: 110xxxxx 10xxxxxx
			result.push(0xC0 | hi >> 6,
						0x80 | hi       & 0x3F);
			continue;
		}
		if (hi < 0xD800 || hi >= 0xE000 ) {
			// code point range: U+0800 - U+FFFF
			// bytes: 1110xxxx 10xxxxxx 10xxxxxx	
			result.push(0xE0 | hi >> 12,
						0x80 | hi >>  6 & 0x3F,
						0x80 | hi       & 0x3F);
			continue;
		}
		i += 1;
		if (i < this.length) {
			// surrogate pair
			const lo = this.charCodeAt(i);
			const code = 0x00010000 + (hi & 0x03FF) << 10 | lo & 0x03FF;
			// code point range: U+10000 - U+10FFFF
			// bytes: 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx
			result.push(0xF0 | code >> 18,
						0x80 | code >> 12 & 0x3F,
						0x80 | code >>  6 & 0x3F,
						0x80 | code       & 0x3F);
		} else {
			break;
		}
	}

	return result;
}

String.prototype.localeCompareNocase = function(s) {
	return this.localeCompare(s, 'en', { 'sensitivity': 'base' })
}

String.prototype.startsWithNocase = function(s) {
	return this.toLowerCase().startsWith(s.toLowerCase());
}

String.prototype.reverse = function() {
	let s = '';
	for (let i = this.length - 1; i >= 0; i--) s += this[i];
	return s;
}

String.prototype.removeComments = function(dialect='c') {
	return this.replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g,'').trim();
}

String.prototype.align = function(n, left=true) {
	const s = n >= this.length ? ' '.repeat(n - this.length) : '';
	return left ? this.concat(s) : s.concat(this);
}

String.prototype.display = function() {
	return this.replace(/[_-]+/g, ' ').splitByCapital().capitalizeFirstLetter();
}

String.longestCommonPrefix = function(strs) {
	let prefix = strs.reduce((acc, str) => str.length < acc.length ? str : acc);
	
	for (let str of strs) {
		while (str.slice(0, prefix.length) != prefix) {
			prefix = prefix.slice(0, -1);
		}
	}

	return prefix;
}

String.prototype.isEmail = function() {
	const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
	return re.test(this.toLowerCase());
}

String.prototype.getInitials = function () {
	const a = this.split(/[ _-]/);
	if (a.length > 1) {
		return a[0][0] + a[1][0];
	}

	return this[0] + this[1];
}

String.isString = function(value) {
	return typeof value == 'string';
}

String.prototype.splitFirst = function(str) {

	let before = this.valueOf(), after;

	const lastIndex = this.indexOf(str);
	if (lastIndex != -1) {
		before = this.slice(0, lastIndex);
		after = this.slice(lastIndex + str.length);
	}

	return [before, after];
}

String.prototype.splitLast = function(str) {

	let before = this.valueOf(), after;

	const lastIndex = this.lastIndexOf(str);
	if (lastIndex != -1) {
		before = this.slice(0, lastIndex);
		after = this.slice(lastIndex + str.length);
	}

	return [before, after];
}

String.sort = function(a, b) {
	if (a < b)
		return -1;

	if ( a > b)
		return 1;

	return 0;
}