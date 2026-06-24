import path from 'path';
// import ytdl from "ytdl-core";

function parseVideoTitle(filename) {

	let name = path.parse(filename).name;

	// remove [YouTubeID]
	name = name.replace(/\[[a-zA-Z0-9_-]{11}\]/g, '');

	// remove "Official Video" junk
	name = name.replace(/\(official.*?\)/ig, '');
	name = name.replace(/\bofficial.*$/ig, '');

	// normalize spaces
	name = name.replace(/\s+/g, ' ').trim();

	return name;
}

function parseArtistTitle(filename) {

	const clean = parseVideoTitle(filename);

	const parts = clean.split(' - ');

	if (parts.length >= 2) {
		return {
			artist: parts[0],
			title: parts.slice(1).join(' - ')
		};
	}

	return {
		artist: null,
		title: clean
	};
}

function normalizeTitle(title) {

	const SMALL_WORDS = new Set([
		'a','an','and','as','at','but','by','for','in','of','on','or','the','to','vs'
	]);

	const ACRONYMS = /^[A-Z0-9.&/]{2,}$/;

	return title
		.split(' ')
		.map((word, i) => {

			const lower = word.toLowerCase();

			if (ACRONYMS.test(word)) return word; // keep DJ, MK, AC/DC

			if (i !== 0 && SMALL_WORDS.has(lower)) return lower;

			return lower.charAt(0).toUpperCase() + lower.slice(1);
		})
		.join(' ');
}

function cleanVideoTitle(filename) {

	let name = path.parse(filename).name;

	// remove youtube id
	name = name.replace(/\[[a-zA-Z0-9_-]{11}\]/g, '');

	// remove official junk
	name = name.replace(/\(official.*?\)/ig, '');
	name = name.replace(/\bofficial.*$/ig, '');

	name = name.replace(/\s+/g, ' ').trim();

	return normalizeTitle(name);
}

function cleanFilename(filename) {
	let name = path.parse(filename).name;

	// remove youtube id
	name = name.replace(/\[[a-zA-Z0-9_-]{11}\]/g, "");

	// remove "official video" noise
	name = name.replace(/\(official.*?\)/ig, "");
	name = name.replace(/\bofficial.*$/ig, "");

	return name.replace(/\s+/g, " ").trim();
}

function parseTrack(filename) {

	let name = cleanFilename(filename);

	let artist = null;
	let title = name;
	let remix = null;
	let feat = null;

	// split artist - title
	const dashSplit = name.split(" - ");

	if (dashSplit.length >= 2) {
		artist = dashSplit[0].trim();
		title = dashSplit.slice(1).join(" - ").trim();
	}

	// extract feat
	const featMatch = title.match(/\b(?:ft\.?|feat\.?)\s+(.+)/i);
	if (featMatch) {
		feat = featMatch[1].trim();
		title = title.replace(featMatch[0], "").trim();
	}

	// extract remix / mix
	const remixMatch = title.match(/\(([^)]*(mix|remix|edit|vip)[^)]*)\)/i);
	if (remixMatch) {
		remix = remixMatch[1];
		title = title.replace(remixMatch[0], "").trim();
	}

	return {
		artist,
		title,
		remix,
		feat
	};
}

function formatDisplayTitle(track) {

	let t = track.title;

	if (track.feat)
		t += ` feat. ${track.feat}`;

	if (track.remix)
		t += ` (${track.remix})`;

	if (track.artist)
		return `${track.artist} - ${t}`;

	return t;
}

function extractYouTubeID(filename) {
	const match = filename.match(/\[([a-zA-Z0-9_-]{11})\]/);
	return match ? match[1] : null;
}


async function fetchYouTubeMetadata(videoId) {

	const info = await ytdl.getBasicInfo(videoId);

	return {
		title: info.videoDetails.title,
		channel: info.videoDetails.author.name,
		length: parseInt(info.videoDetails.lengthSeconds),
		thumbnails: info.videoDetails.thumbnails
	};
}

async function processFile(filename) {

	const id = extractYouTubeID(filename);

	if (!id) return null;

	const meta = await fetchYouTubeMetadata(id);

	return {
		youtubeId: id,
		title: meta.title,
		artist: meta.channel,
		duration: meta.length
	};
}

// https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg

export function getMetaFromFilename(filename) {
	const track = parseTrack(filename);

	let title = track.title,
		artist = track.artist;

	if (track.remix)
		title += ` (${track.remix})`;

	if (artist && track.feat) 
		artist += ` feat. ${track.feat}`;

	return { title, artist };
}

export function getMetaFromFilename2(filename) {

	let name = path.parse(filename).name;

	console.log('####', name);

	name = name
		.replace(/\[[a-zA-Z0-9_-]{11}\]/g, "") // remove youtube id
		.replace(/\[[^\]]+\]/g, "") // remove label tags like [Ultra Music]
		.replace(/\(official.*?\)/ig, "") // remove official video text
		.replace(/\(((ft\.?|feat\.?).*?)\)/i, '$1') // strip surrounding parentheses
		;

	console.log('#', name);

	let artist = null;
	let title = name;


	// 1️⃣ Artist - Title
	if (name.includes(" - ")) {

		const parts = name.split(" - ");

		artist = parts[0].trim();
		title = parts.slice(1).join(" - ").trim();

	}
	// 2️⃣ Title - Artist
	else if (name.match(/\)\s*-\s*/)) {

		const parts = name.split(" - ");

		title = parts[0].trim();
		artist = parts[1].trim();

	}
	// 3️⃣ Title feat Artist
	else if (name.match(/\b(ft\.?|feat\.?)\b/i)) {

		// const match = name.match(/(.+?)\s+(ft\.?|feat\.?)\s+(.+)/i);
		const match = name.match(/(.+?)\s+\(?(ft\.?|feat\.?)\)?\s+(.+)/i);

		console.log(match);

		if (match) {
			title = match[1].trim();
			artist = `${match[1].trim()} ${match[2]} ${match[3].trim()}`;
		}

	}
	// 4️⃣ fallback
	

	// move "feat" from title to artist if artist exists
	const featMatch = title.match(/\s+(ft\.?|feat\.?)\s+(.+)/i);

	if (featMatch && artist) {

		artist = `${artist} ${featMatch[1]} ${featMatch[2]}`.trim();
		title = title.replace(featMatch[0], "").trim();

	}

	if (artist && artist.startsWith(title)) {
		artist = artist.substring(title.length).trim();
	}

	return { title, artist };
}



export function splitByDashOutsideBrackets(str) {

	const parts = [];

	let current = "";
	let round = 0;   // ()
	let square = 0;  // []

	for (let i = 0; i < str.length; i++) {

		const c = str[i];

		if (c === "(") round++;
		else if (c === ")") round--;

		else if (c === "[") square++;
		else if (c === "]") square--;

		if (c === "-" && round === 0 && square === 0) {

			parts.push(current.trim());
			current = "";
			continue;

		}

		current += c;

	}

	if (current.length)
		parts.push(current.trim());

	return parts;

}

function nameFromFilename(filename, fullname) {
	let name = fullname ? path.parse(filename).name : filename;

	// console.log('####', name);

	name = name
		.replace(/\[[a-zA-Z0-9_-]{11}\]/g, "") // remove youtube id
		.replace(/\(official.*?\)/i, "")
		.replace(/\(video.*?\)/i, "")
		.replace(/\[[^\]]+\]/g, "") // remove label tags like [Ultra Music]
		.replace(/\s+/g, ' ')
		// .replace(/\(official.*?\)/ig, "") // remove official video text
		// .replace(/\(((ft\.?|feat\.?).*?)\)/i, '$1') // strip surrounding parentheses
		;

	return name.trim();
}


export function getMetaFromFilename3(filename) {
	let name = nameFromFilename(filename);

	const parts = splitByDashOutsideBrackets(name);

	const scoredParts = parts.map(p => ({
		text: p,
		artistScore: artistProbability(p),
		titleScore: titleProbability(p)
	}));

	// choose artist = highest artistScore, title = highest titleScore
	let artist = scoredParts.reduce((a,b) => a.artistScore > b.artistScore ? a : b).text;
	let title = scoredParts.filter(p => p.text !== artist).map(p => p.text).join(" - ");

	// const ranked = parts
	// 	.map(p => ({
	// 		text: p,
	// 		score: artistProbability(p)
	// 	}))
	// 	.sort((a,b) => b.score - a.score);

	// let artist = ranked[0].text;

	// let title = parts
	// 	.filter(p => p !== artist)
	// 	.join(" - ");

	if (!title) {
		title = artist;
		artist = '';
	}
	else {
		
		const [name, feat] = artist.split('feat.').map(i => i.trim());

		if (feat) {
			if (titleProbability(name) > titleProbability(title)) {
				artist = `${title} feat. ${feat}`;
				title = name;
			}
		}
	}

	return { title, artist };

	function titleProbability(str) {

		const commonWords = new Set([
			"the","be","to","of","and","a","in","that","have","i",
			"it","for","not","on","with","he","as","you","do","at",
			"this","but","his","by","from","they","we","say","her","she",
			"or","an","will","my","one","all","would","there","their",
			"what","so","up","out","if","about","who","get","which",
			"go","me","when","make","can","like","time","no","just",
			"him","know","take","people","into","year","your","good",
			"some","could","them","see","other","than","then","now",
			"look","only","come","its","over","think","also","back",
			"after","use","two","how","our","work","first","well",
			"way","even","new","want","because","any","these","give",
			"day","most","us"
		]);

		const words = str.toLowerCase().split(/\s+/);

		let count = 0;
		for (const w of words) {
			if (commonWords.has(w)) count++;
		}

		// simple ratio: #common words / total words
		const ratio = count / words.length;

		// optional scaling to 0..1 probability
		return Math.min(1, ratio * 2); // multiply by 2 to make 1–2 words already strong signal
	}

	function artistProbability(str) {

		const artistRules = [

			// featuring
			str => /\b(ft\.?|feat\.?)\b/i.test(str) ? 3 : 0,

			// vs artists
			str => /\bvs\.?\b/i.test(str) ? 3 : 0,

			// collaboration separators
			str => /[,&]/.test(str) ? 1 : 0,

			// remix words → title signal
			str => /\b(remix|mix|edit|extended|vip)\b/i.test(str) ? -3 : 0,

			// parentheses often indicate title metadata
			str => /\(.{5,}\)/.test(str) ? -1 : 0,

			// stopwords (titles)
			str => {
				const stopwords = ["the","to","you","me","my","your"];
				const words = str.toLowerCase().split(/\s+/);
				return -0.5 * words.filter(w => stopwords.includes(w)).length;
			},

			// capitalization heuristic
			str => {
				const words = str.split(/\s+/);
				let score = 0;

				for (const w of words) {

					if (/^[A-Z0-9]{2,}$/.test(w)) score += 2;
					else if (/^[A-Z][a-z]/.test(w)) score += 1;
					else if (/^[a-z]/.test(w)) score -= 1;

				}

				return score / words.length;
			}

		];

		const rawScore = scoreWithRules(str, artistRules);

		// logistic normalization
		return 1 / (1 + Math.exp(-rawScore / 3));

		function scoreWithRules(str, rules) {

			let score = 0;

			for (const rule of rules) {
				score += rule(str);
			}

			return score;

		}
	}

	function splitByDashOutsideBrackets(str) {

		const parts = [];
		let current = '';

		let parenDepth = 0;
		let squareDepth = 0;

		for (const ch of str) {

			if (ch === '(') parenDepth++;
			else if (ch === ')') parenDepth--;

			else if (ch === '[') squareDepth++;
			else if (ch === ']') squareDepth--;

			// split only when not inside brackets
			if (ch === '-' && parenDepth === 0 && squareDepth === 0) {

				parts.push(current.trim());
				current = '';
				continue;

			}

			current += ch;
		}

		if (current) parts.push(current.trim());

		return parts.filter(Boolean);
	}
}