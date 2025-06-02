import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use relative paths for assets to ensure proper routing on Railway
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 4173
  }
})
