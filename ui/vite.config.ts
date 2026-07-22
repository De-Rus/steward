import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/manage/',
  plugins: [react()],
  server: {
    proxy: {
      '/manage/api': {
        target: 'http://localhost:8686',
        changeOrigin: true,
      },
    },
  },
})
