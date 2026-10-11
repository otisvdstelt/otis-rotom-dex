import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js + R3F + drei + postprocessing land in one lazily loaded chunk;
    // the HUD paints from the small main chunk before it arrives.
    chunkSizeWarningLimit: 1300,
  },
})
