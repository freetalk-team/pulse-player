// Check if the 'isElectron' flag we injected in preload exists
//export const isElectron = !!window.isElectron;
export const isElectron = typeof window !== 'undefined' && !!window.api?.isElectron;

// Vite's built-in env check
export const isDev = import.meta.env.DEV;
