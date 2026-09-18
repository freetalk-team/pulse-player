import { resolve } from 'path';

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({

	root: 'src/web',

	build: {
        outDir: '../../resources/web',
        emptyOutDir: true
    },

	resolve: {
		alias: {
			'@pkg': resolve(__dirname, 'package.json'),
        	'@resources': resolve(__dirname, 'resources'),
			'@common': resolve(__dirname, 'src/common'),
			'@frontend': resolve(__dirname, 'src/frontend'),
			'@components': resolve(__dirname, 'src/frontend/components'),
			'@stores': resolve(__dirname, 'src/frontend/stores'),
		}
    },

	define: {
      __PLATFORM__: JSON.stringify('remote')
    },

	server: mode === 'development'
        ? {
            proxy: {
                '/api': {
                    target: 'http://localhost:4321'
                },
				'/ws': {
					target: 'ws://localhost:4321',
					ws: true
				}
            }
        }
        : undefined,

	plugins: [
		svelte(),
		tailwindcss()
	]
}));