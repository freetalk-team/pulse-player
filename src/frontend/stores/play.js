import { writable, get } from 'svelte/store';


// --- STORES ---
export const isPlaying = writable(false);
export const currentTrack = writable(null);
export const currentRadio = writable(null);
export const queue = writable([]);
export const queueSets = writable([]);
export const recent = writable([]);
export const queueMode = writable(false);
export const shuffleMode = writable(false);
export const repeatMode = writable(false);
export const videoMode = writable(true);
export const volume = writable(50);
export const currentTime = writable(0);
export const duration = writable(0);

// Single Engine Stores
export const videoElement = writable(null); // The 1-and-only DOM element
export const isVideoView = writable(false);  // Toggle for the "Hole" in Main

export const analyserEnabled = writable(false);

let isInitialized = false;
let lastVolume = 50;
let isRadio = false;

let updateVolumePrefTimeout;
let volumePref;

let analyser, dataArray, audioCtx;

const audio = new Audio;

// --- INITIALIZATION ---
export async function initPlayer() {

	isInitialized = false; 
	
	const prefs = api.getPref('player');
	if (prefs) {
		volume.set(prefs.volume ?? 25);
		queueMode.set(prefs.queueMode ?? false);
		repeatMode.set(prefs.repeatMode ?? false);
		shuffleMode.set(prefs.shuffleMode ?? false);
		videoMode.set(prefs.videoMode ?? true);
	}

	isInitialized = true;

	const tracks = await api.getRecentTracks(100);
	recent.set(tracks);

	audio.onplay = () => {
		if (isRadio)
			isPlaying.set(true);
	}

	audio.onpause = () => {
		if (isRadio)
			isPlaying.set(false);
	}

	audio.volume = get(volume) / 100;
}


videoElement.subscribe(el => {
	if (!el) return;

	createAnalyser(el);

	// Attach Event Listeners to the Video Tag (Acts as our Audio Engine)
	el.onplay = () => {
		if (!isRadio) {
			isPlaying.set(true);
			if (audioCtx?.state === 'suspended')
				audioCtx.resume();
		}
	}

	el.onpause = () => {
		if (!isRadio)
			isPlaying.set(false);
	}

	el.onended = () => playNext();
	el.ontimeupdate = () => setTime(el.currentTime);
	el.onloadedmetadata = () => setDuration(el.duration);
	el.ondurationchange = () => setDuration(el.duration);

	// el.onerror = () => {
	// 	console.error('Audio error:');
	// 	console.debug(el.error);
    // 	console.debug(el.networkState);
    // 	console.debug(el.readyState);
	// }

	// el.onseeking = () => { isInternalSeeking = true; };
	// el.onseeked = () => { isInternalSeeking = false; };


	// Sync volume from store to element
	el.volume = get(volume) / 100;

	function setDuration(d) {
		if (isFinite(d)) {
			duration.set(d);
		}
	}

	function setTime(t) {
		currentTime.set(t);
	}
});



// Sync volume changes to the element and persistence
volume.subscribe(v => {
	const vol = v / 100;

	audio.volume = vol;

	const el = get(videoElement);
	if (el) el.volume = vol;

	if (isInitialized) {

		volumePref = v;

		if (!updateVolumePrefTimeout) {

			updateVolumePrefTimeout = setTimeout(() => {
				api.setPref('player.volume', volumePref);
				updateVolumePrefTimeout = null;
			}, 2000);
		}
	}
});

queueMode.subscribe(v => {
	if (isInitialized) 
		api.setPref('player.queueMode', v);
});

repeatMode.subscribe(v => {
	if (isInitialized) 
		api.setPref('player.repeatMode', v);
});

shuffleMode.subscribe(v => {
	if (isInitialized) 
		api.setPref('player.shuffleMode', v);
});

videoMode.subscribe(v => {
	if (isInitialized) 
		api.setPref('player.videoMode', v);
});

export function playTrack(track, force=false) {

	console.debug('Play track:', track);

	if (get(queueMode) && get(currentTrack)) {
		
		queue.update(q => {
			const filtered = q.filter(t => t.id !== track.id);
			return force ? filtered : [...filtered, track];
		});

		if (force)
			startMedia(track);

	} else {
		startMedia(track);
	}
}

export function enqueueTrack(track) {
	if (!get(currentTrack)) {
		startMedia(track);
		return;
	}

	queue.update(q => [...q.filter(t => t.id !== track.id), track]);
}

export async function playSet(set, force=false) {
	if (force || !get(queueMode) || !get(currentTrack)) {
		playCollection(set);
	}
	else {
		queueSets.update(sets => [...sets, set]);
	}
}

export function playRadio(station) {
	const el = get(videoElement);
	if (!el) {
		console.error("Engine not ready yet!");
		return;
	}

	if (!isRadio) {
		currentTrack.set(null);
		isVideoView.set(false);
		currentTime.set(0);
		duration.set(0);

		disableAnalyser();
	}

	isRadio = true;
	el.pause();

	currentRadio.set(station);

	api.updateLastPlayedStation(station);

	// platform.play(audio, station.url)
	audio.src = station.url;
	audio.play()
		.catch(err => {
			console.error("Playback failed:", err);
			report.error('Failed to play radio');
		});
}

export function stop() {
	if (isRadio) {
		currentRadio.set(null);
		if (!audio.paused)
			audio.pause();

		isRadio = false;
	}
	else {
		currentTrack.set(null);
		isVideoView.set(false);
		
		const el = get(videoElement);
		if (el && !el.paused)
			el.pause();
	}

	isPlaying.set(false);
	currentTime.set(0);
	duration.set(0);
}

export function togglePlayback() {
	if (isRadio) {
		const isPaused = audio.paused;

		if (isPaused) 
			audio.play();
		else 
			audio.pause();

		return;
	}

	const el = get(videoElement);
	if (!el) {
		// Fallback: If no track loaded, try to play first from queue
		const q = get(queue);
		if (q.length > 0) {
			const first = q[0];
			queue.set(q.slice(1));
			startMedia(first);
		}
		return;
	}

	const isPaused = el.paused;

	if (isPaused && !get(currentTrack)) {
		playNext(true);
		return;
	}

	if (isPaused) 
		el.play();
	else 
		el.pause();
}

export function toggleMute() {
	volume.update(v => {
		if (v > 0) {
			lastVolume = v;
			return 0;
		}
		return lastVolume || 50;
	});
}

export function seek(seconds) {
	if (isRadio) return;

	const el = get(videoElement);
	if (!el) return;

	console.log('Seek:', seconds);

	el.currentTime = seconds;
}

export function playNext(force=false) {
	const q = get(queue);
	if (q.length > 0) {
		const index =  get(shuffleMode)
					? Math.floor(Math.random() * q.length)
					: 0;

		const [nextTrack] = q.splice(index, 1);
		queue.update(q => [...q]);

		startMedia(nextTrack);

		if (q.length == 0) {
			enqueueNextCollection();
		}
	}
	else {
		if (playNextCollection()) return;

		if (force || get(repeatMode)) {
			const tracks = get(recent);
			if (tracks.length > 0) {

				const index = get(shuffleMode) && tracks.length > 2
					? 1 + Math.floor(Math.random() * (tracks.length - 1))
					: tracks.length - 1;

				startMedia(tracks[index]);

				return;
			}
		}

		isVideoView.set(false);
		currentTrack.set(null);
		currentTime.set(0);
	}
}

export function playPrev() {
	const el = get(videoElement);
	if (el && el.currentTime > 3) {
		el.currentTime = 0;
	} else {
		console.log("Going to previous (requires history store)");
	}
}

export function enqueueTracks(tracks) {
	if (!tracks || tracks.length === 0) return;
	
	// queue.update(q => [...q.filter(i => !tracks.find(t => i.id == t.id)), ...tracks]);
	queue.update(q => [...q, ...tracks.filter(t => !q.find(i => i.id == t.id))]);

	if (!get(currentTrack)) 
		playNext();
}

export function pause() {
	if (get(isPlaying)) {
		const el = get(videoElement);

		// Force the engine to pause
		if (el) el.pause();
		isPlaying.set(false);
	}
}

export function updateTrack(track) {

	update(queue);
	update(recent);

	function update(store) {
		store.update(list => {
			const index = list.findIndex(i => i.id == track.id);
			if (index != -1)
				list.splice(index, 1, track);
			return list;
		});
	}
}

function startMedia(track) {
	const el = get(videoElement);
	if (!el) {
		console.error("Engine not ready yet!");
		return;
	}

	if (isRadio) {
		currentRadio.set(null);

		isRadio = false;

		audio.pause();
	}

	enableAnalyser(el);
	

	// api.incrementTrackRating(track.id).then(() => {
	// 	// Optional: Refresh previews so the Home cards update 
	// 	// if this play changed the "Top 4" for a playlist

	// 	//loadPlaylistPreviews(); 
	// });

	if (!track.remote) {
		api.updateLastPlayedTrack(track).then(() => {
			// Refresh stores so the 'Recently Played' grid updates
			// loadAlbums(); 
			// loadPlaylists();
		});
	}

	currentTrack.set(track);

	if (track.duration && isFinite(track.duration)) {
		duration.set(track.duration);
	} else {
		duration.set(0); 
	}
	
	// Logic: Is this a video or audio?
	isVideoView.set(track.type === 'video');
	
	platform.play(el, track.path)
		.then(() => {
			recent.update((list) => [track, ...list.filter(i => i.id != track.id)]);
		})
		.catch(err => {
			console.error("Playback failed:", err);
			report.error('Failed to play track');
			playNext();
	});
}

export function removeFromRecent(track) {

	const id = typeof track == 'object' ? track.id : track;

	recent.update(list => list.filter(i => i.id != id));

}

async function enqueueNextCollection() {
	const sets = get(queueSets);
	if (sets.length > 0) {

		const set = sets[0];
		queueSets.update(queue => queue.slice(1));

		await enqueueCollection(set);
	}
}

async function enqueueCollection(set) {
	const id = set.id;

	let tracks;

	switch (set.type) {

		case 'album':
		tracks = await api.getAlbumTracks(id, set.remote);
		break;

		case 'playlist':
		tracks = await api.getPlaylistTracks(id, set.remote);
		break;

		case 'playset': {
			const sets = await api.getPlaysetMembers(id, set.remote);
			queueSets.set(sets);

			await api.updateLastPlayed(id, 'playlist');
			await enqueueNextCollection();

			return;
		}
		
		break;
	}

	if (tracks.length == 0) return;

	queue.set(tracks);

	if (!set.remote) {
		await api.updateLastPlayed(id, set.type);
	}
}

async function playCollection(set) {

	await enqueueCollection(set);

	playNext();
}

function playNextCollection() {
	const sets = get(queueSets);
	if (sets.length > 0) {

		const set = sets[0];
		queueSets.update(queue => queue.slice(1));

		playCollection(set);

		return true;
	}
}

function createAnalyser(video) {
	const AudioContext = window.AudioContext || window.webkitAudioContext;
	audioCtx = new AudioContext();
	analyser = audioCtx.createAnalyser();
	analyser.fftSize = 128; 
	analyser.smoothingTimeConstant = 0.8; 

	analyser.connect(audioCtx.destination);

	dataArray = new Uint8Array(analyser.frequencyBinCount);

	const source = audioCtx.createMediaElementSource(video);
	source.connect(analyser);
}

function enableAnalyser(video) {
	analyserEnabled.set(true);
}

function disableAnalyser() {
	analyserEnabled.set(false);
}

export function getAnalyserData() {
	analyser.getByteFrequencyData(dataArray);
	return dataArray;
}