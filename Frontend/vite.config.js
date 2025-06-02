import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/_redirects',
          dest: '.' // this copies it directly into dist/
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 4173,
  },
  // Add this for proper SPA routing
  server: {
    historyApiFallback: true,
  }
})