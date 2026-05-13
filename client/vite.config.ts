import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/rail-delay-repay/',
  build: {
    outDir: '../server/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/rail-delay-repay/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
