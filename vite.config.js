import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  base: '/',
  plugins: [
    legacy({
      targets: ['> 0.5%', 'not dead'],
    }),
  ],
  build: {
    outDir: 'dist',
  },
})
