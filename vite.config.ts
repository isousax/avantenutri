import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          ui: [
            '@tanstack/react-query',
            '@tanstack/react-query-devtools',
            'framer-motion'
          ],
          // markdown chunk removido: 'marked' e 'highlight.js' agora carregados apenas via import dinâmico no editor
        }
      }
    },
    chunkSizeWarningLimit: 1200
  }
})
