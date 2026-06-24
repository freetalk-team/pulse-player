import { defineConfig } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { join, resolve } from 'path'


export default defineConfig({
  
  main: {
    resolve: {
      alias: {
        '@common': resolve(__dirname, 'src/common')
      }
    },
    build: {
      sourcemap: true, // 👈 Add this line
      rollupOptions: {
        // external: ['electron', 'node:worker_threads'],
        // Ensure the worker is treated as an entry point if it's not being auto-detected
        input: {
          index: join(__dirname, 'src/main/index.js'),
          scanner2: join(__dirname, 'src/main/workers/scanner2.js')
        }
      },
      minify: true,
      terserOptions: {
        compress: {
          drop_console: true, // 👈 Removes all console.logs
          drop_debugger: true // 👈 Removes all debugger; statements
        }
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@pkg': resolve(__dirname, 'package.json'),
        '@resources': resolve(__dirname, 'resources'),
        '@common': resolve(__dirname, 'src/common'),
			  '@frontend': resolve(__dirname, 'src/frontend'),
      }
    },
    build: {
      sourcemap: true, // Enable for production builds
    },
    // This is the important one for Dev mode
    css: { devSourcemap: true },
    plugins: [svelte()]
  },
  server: {
    sourcemap: true // Ensure dev server provides maps
  }
})
