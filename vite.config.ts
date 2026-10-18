import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three'
          }
          if (id.includes('node_modules/')) {
            return 'vendor-core'
          }
          if (id.includes('src/data/terraHexGrid') || id.includes('src/data/terraRegions')) {
            return 'data-terra-map'
          }
          if (id.includes('src/data/stories/')) {
            return 'data-stories'
          }
        },
      },
    },
  },
})
