import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/estadio-verde/',
  plugins: [react()],
  build: {
    minify: 'esbuild',
    target: 'es2020',
    esbuildOptions: {
      // Evita TDZ por renombrado de variables cortas como _
      minifyIdentifiers: false,
    }
  }
})
