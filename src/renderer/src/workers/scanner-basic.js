// src/renderer/src/workers/scanner.js
import * as mm from 'music-metadata-browser';

self.onmessage = async (e) => {
  const { files } = e.data; // Array of File objects from drag-and-drop
  
  for (const file of files) {
    try {
      // Parse metadata (artist, title, album, etc.)
      const metadata = await mm.parseBlob(file);
      
      const track = {
        path: file.path, // Only exists in Electron
        title: metadata.common.title || file.name,
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        duration: Math.round(metadata.format.duration || 0),
        size: file.size
      };

      // Send result back to the UI
      self.postMessage({ type: 'TRACK_FOUND', track });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message, fileName: file.name });
    }
  }
  
  self.postMessage({ type: 'SCAN_COMPLETE' });
};
