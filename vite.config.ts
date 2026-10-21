import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // 3D libraries load in one lazy chunk so the HUD paints first
    chunkSizeWarningLimit: 1300,
  },
})
