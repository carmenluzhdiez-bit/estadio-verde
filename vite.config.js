import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/estadio-verde/',
  plugins: [react()],
  build: {
    minify: false,
    target: 'es2020',
  }
})
