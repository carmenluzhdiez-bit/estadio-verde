import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/estadio-verde/',
  plugins: [react()],
  build: {
    // Usar esbuild para minificación (más predecible que terser/rollup)
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        // Un solo chunk para evitar problemas de scope entre módulos
        inlineDynamicImports: true,
      }
    }
  },
  esbuild: {
    // NO renombrar identificadores — evita TDZ por colisión de nombres cortos
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
  }
})
