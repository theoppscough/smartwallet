import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/smartwallet-mvp/',
  server: {
    port: 5173,
  },
})
