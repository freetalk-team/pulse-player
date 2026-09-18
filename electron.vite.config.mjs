import { defineConfig } from 'electron-vite'
import { join, resolve } from 'path'
import { execSync } from "node:child_process";

import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// const debugWorker = process.env.DEBUG_WORKER === '1';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({

  

  esbuild: {
    drop: ['console', 'debugger']
  },

  main: {
    resolve: {
      alias: {
        '@common': resolve(__dirname, 'src/common')
      }
    },
    build: {
      // minify: !debugWorker,
      //minify: true,
      minify: isProd ? 'terser' : false, // uses terser
      //minify: 'esbuild',
      sourcemap: !isProd, // 👈 Add this line
      externalizeDeps: {
        exclude: ['electron-store']
      },
      rollupOptions: {
        // external: ['electron', 'node:worker_threads'],
        // Ensure the worker is treated as an entry point if it's not being auto-detected
        input: {
          index: join(__dirname, 'src/main/index.js'),
          app: join(__dirname, 'src/main/app.js'),
          headless: join(__dirname, 'src/main/headless.js'),
          import: join(__dirname, 'src/main/import.js'),
          scanner: join(__dirname, 'src/main/workers/import.worker.js'),
          downloader: join(__dirname, 'src/main/workers/downloader.js')
        }
      },
      terserOptions: {
        compress: {
          drop_console: false, // 👈 Removes all console.logs
          drop_debugger: true,// 👈 Removes all debugger; statements
          pure_funcs: ['console.debug']
          // pure_funcs: [
          //   'console.log',
          //   'console.debug',
          //   'console.info',
          //   'console.trace'
          // ]
        }
      }
    },
  },
  preload: {},
  renderer: {
    define: {
      __PLATFORM__: JSON.stringify('desktop')
      // __PLATFORM__: JSON.stringify(mode === 'development' ? 'desktop' : 'web'),
      //__CAN_EDIT__: mode === 'development',
    },

    server: {
      port: 5174, // FIX: Bypasses the port collision with your website
      strictPort: true
    },
    resolve: {
      alias: {
        '@pkg': resolve(__dirname, 'package.json'),
        '@resources': resolve(__dirname, 'resources'),
        '@common': resolve(__dirname, 'src/common'),
			  '@frontend': resolve(__dirname, 'src/frontend'),
      }
    },
    build: {
      sourcemap: !isProd, // Enable for production builds
      minify: isProd ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: true, // 👈 Removes all console.logs
          drop_debugger: true // 👈 Removes all debugger; statements
        }
      }
    },
    // This is the important one for Dev mode
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
})
