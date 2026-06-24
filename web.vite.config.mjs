import { resolve } from 'path';

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({

	root: 'src/web',

	resolve: {
		alias: {
			'@pkg': resolve(__dirname, 'package.json'),
        	'@resources': resolve(__dirname, 'resources'),
			'@common': resolve(__dirname, 'src/common'),
			'@frontend': resolve(__dirname, 'src/frontend'),
		}
    },

	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:4321'
			},
			'/ws': {
				target: 'ws://localhost:4321',
				ws: true
			}
		}
	},

	plugins: [svelte()]
});