import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Cambia a '/TU-REPO/' si publicas en subcarpeta de GitHub Pages
  base: './'
})
