import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',  // ✅ CHANGE THIS LINE
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
