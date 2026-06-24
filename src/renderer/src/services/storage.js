// src/renderer/src/services/storage.js
import { isElectron } from '../utils/env';

export const storage = {
  async saveMusicFolder(pathOrHandle) {
    if (isElectron) {
      // Send path to Electron Main process to save in a config file
      window.electron.ipcRenderer.send('save-library-path', pathOrHandle);
    } else {
      // Save FileHandle to IndexedDB for the Web Demo
      const db = await openDB();
      await db.put('folders', pathOrHandle, 'main-library');
    }
  },
  
  async getLibrary() {
     // Logic to retrieve based on platform...
  }
};
