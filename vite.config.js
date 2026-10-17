import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/bingr-api': {
        target: 'https://api.bingr.one/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bingr-api/, ''),
        headers: {
          Referer: 'https://bingr.one/',
          Origin: 'https://bingr.one',
        },
      },
    },
  },
})
