import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],

  /* Ban build (va khi xem thu ban build bang npm run preview) chay tai
     https://lnismeee.github.io/Dartcode52-server/  (duong dan CON), con khi
     chay thu tren may bang npm run dev thi o goc http://localhost:5174/ */
  base: command === 'build' || isPreview ? '/Dartcode52-server/' : '/',

  server: {
    port: Number(process.env.PORT) || 5174,
    // Luon dung dung mot link - neu da co ban dang chay thi bao loi,
    // khong tu nhay sang 5175, 5176...
    strictPort: true,
  },

  // npm run preview: xem thu ban build (giong het ban tren GitHub Pages)
  preview: {
    port: Number(process.env.PORT) || 4173,
  },
}))
