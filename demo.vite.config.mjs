import { resolve } from 'path';

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
	const isProd = mode === 'production';
	
	return {

		root: 'src/demo',
		base: '/player/demo',

		assetsInclude: [
            '**/*.wasm'
        ],


		build: {
			outDir: '../../out/demo',
			emptyOutDir: true,
			sourcemap: !isProd, // Enable for production builds
			minify: isProd ? 'terser' : false,
			terserOptions: {
				compress: {
					drop_console: true, // 👈 Removes all console.logs
					drop_debugger: true,// 👈 Removes all debugger; statements
				}
			}
		},

		resolve: {
			alias: {
				'@pkg': resolve(__dirname, 'package.json'),
				'@resources': resolve(__dirname, 'resources'),
				'@common': resolve(__dirname, 'src/common'),
				'@frontend': resolve(__dirname, 'src/frontend'),
				'@components': resolve(__dirname, 'src/frontend/components'),
				'@stores': resolve(__dirname, 'src/frontend/stores'),
				'@wasm': resolve(__dirname, 'src/wasm')
			}
		},

		define: {
			__PLATFORM__: JSON.stringify('web')
		},

		server: mode === 'development'
			? {
				proxy: {
					'/api': {
						target: 'http://localhost:5000'
					}
				}
			}
			: undefined,
		
		css: { 
			devSourcemap: !isProd 
		},
		plugins: [
			tailwindcss(),
			svelte({
				onwarn(warning, handler) {
					const ignore = ['element_invalid_self_closing_tag'];

					if (ignore.includes(warning.code) || warning.code.startsWith('a11y_')) {
					return;
					}

					handler(warning);
				}
			})
		]
	}
});
