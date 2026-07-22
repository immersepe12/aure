import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        healthcare: resolve(__dirname, 'healthcare.html'),
        construction: resolve(__dirname, 'construction.html'),
      },
    },
  },
})
