

const templateItem = { artist: 'Alice', name: 'Rock Beats', index: '01', title: 'Never Born', genre: 'Rock', 'station': 'Nova Radio', time: '20260811' };

export function getPreviewPath(opt, item=templateItem) {
    return `${opt.rootDir}/${opt.subdirPattern?.trim()}/${opt.filenamePattern?.trim()}.mp3`
        .replaceAll('[ARTIST]', item.artist)
        .replaceAll('[ALBUM]', item.name)
        .replaceAll('[ALBUM_YEAR]', item.year ? `${item.name} (${item.year})` : item.name)
        .replace('[GENRE]', item.genre)
        .replace('[INDEX]', '01')
        .replace('[TITLE]', item.title)
        .replace('[STATION]', item.station)
        .replace('[TIME]', item.time)
        .replace(/\/+/g, '/'); // Clean up any duplicate backslashes
}

export function placeholders(vars) {
	return vars
		.map(i => `<span class="text-zinc-300 font-mono">${i.toUpperCase()}</span>`)
		.join(', ');
}