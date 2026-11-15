import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relatieve paden, zodat de app ook werkt op GitHub Pages
  // (daar staat hij in een submap, bijv. https://<gebruiker>.github.io/1/)
  base: './',
})
