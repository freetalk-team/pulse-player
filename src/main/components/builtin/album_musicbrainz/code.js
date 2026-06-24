// Step 1: search release
const res = await http.get('https://musicbrainz.org/ws/2/release/', {
  params: {
    query: `artist:"${track.artist}" AND release:"${track.album}"`,
    fmt: 'json',
    limit: config.limit || 1
  },
  headers: {
    'User-Agent': config.userAgent
  }
});

const release = res.releases?.[0];

if (!release) {
  log('No release found');
  return;
}

// Step 2: fetch cover art
const coverUrl = `https://coverartarchive.org/release/${release.id}/front`;

// Some releases don't have cover art → optional check
try {
  // Optionally verify it exists
  await http.get(coverUrl, { responseType: 'blob' });

  setThumbnail(track, coverUrl);

  log('Thumbnail set from MusicBrainz');
} catch (e) {
  log('No cover art found');
}
