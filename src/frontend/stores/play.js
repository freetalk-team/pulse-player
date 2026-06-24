import { writable, get } from 'svelte/store';


// --- STORES ---
export const isPlaying = writable(false);
export const currentTrack = writable(null);
export const queue = writable([]);
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

let isInitialized = false;
let lastVolume = 50;

// --- INITIALIZATION ---
export async function syncPlayerPrefs() {
	
	const prefs = await api.getPrefs();
	if (prefs) {
		isInitialized = false; 

		if (prefs.volume !== undefined) volume.set(prefs.volume);
		if (prefs.queueMode !== undefined) queueMode.set(prefs.queueMode);
		if (prefs.repeatMode !== undefined) repeatMode.set(prefs.repeatMode);
		if (prefs.shuffleMode !== undefined) shuffleMode.set(prefs.shuffleMode);
		if (prefs.videoMode !== undefined) videoMode.set(prefs.videoMode);

		isInitialized = true;
	}
}


videoElement.subscribe(el => {
	if (!el) return;

	// Attach Event Listeners to the Video Tag (Acts as our Audio Engine)
	el.onplay = () => isPlaying.set(true);
	el.onpause = () => isPlaying.set(false);
	el.onended = () => playNext();
	el.ontimeupdate = () => setTime(el.currentTime);
	el.onloadedmetadata = () => setDuration(el.duration);
	el.ondurationchange = () => setDuration(el.duration);

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


let updateVolumePrefTimeout;
let volumePref;

// Sync volume changes to the element and persistence
volume.subscribe(v => {
	const el = get(videoElement);
	if (el) el.volume = v / 100;

	if (isInitialized) {

		volumePref = v;

		if (!updateVolumePrefTimeout) {

			updateVolumePrefTimeout = setTimeout(() => {
				api.setPref('volume', volumePref);
				updateVolumePrefTimeout = null;
			}, 2000);
		}
	}
});

queueMode.subscribe(v => {
	if (isInitialized) 
		api.setPref('queueMode', v);
});

repeatMode.subscribe(v => {
	if (isInitialized) 
		api.setPref('repeatMode', v);
});

shuffleMode.subscribe(v => {
	if (isInitialized) 
		api.setPref('shuffleMode', v);
});

videoMode.subscribe(v => {
	if (isInitialized) 
		api.setPref('videoMode', v);
});

export function playTrack(track, force=false) {

	console.debug('Play track:', track);

	if (get(queueMode) && get(currentTrack)) {
		
		queue.update(q => {
			const filtered = q.filter(t => t.path !== track.path);
			return force ? filtered : [...filtered, track];
		});

		if (force)
			startMedia(track);

	} else {
		startMedia(track);
	}
}

export function togglePlayback() {
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

		queue.set(q);

		startMedia(nextTrack);
	}
	else {
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

function startMedia(track) {
	const el = get(videoElement);
	if (!el) {
        console.error("Engine not ready yet!");
        return;
    }

	// api.incrementTrackRating(track.id).then(() => {
	// 	// Optional: Refresh previews so the Home cards update 
	// 	// if this play changed the "Top 4" for a playlist

	// 	//loadPlaylistPreviews(); 
	// });

	if (!track.remote) {
		api.updateLastPlayed(track).then(() => {
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
	
	// const path = `media:///${encodeURIComponent(track.path)}`;
	const path = platform.resolve(track.path);

	// console.log('Loading:', path);

	// Load and Play
	el.src = path;
	el.play()
		.then(() => {
			recent.update((list) => [track, ...list.filter(i => i.id != track.id)]);
		})
		.catch(err => {
			console.error("Playback failed:", err);
			playNext();
	});
}

export function removeFromRecent(track) {

	const id = typeof track == 'object' ? track.id : track;

	recent.update(list => list.filter(i => i.id != id));

}