import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Gagal keras kalau 5173 dipakai, jangan pindah diam-diam ke 5174+
    // karena URL di terminal jadi tidak cocok dengan FRONTEND_URL backend.
    strictPort: true,
    proxy: {
      // Dev selalu talks ke backend lokal lewat proxy (origin sama, tanpa CORS).
      // Backend produksi diambil lewat VITE_API_URL, bukan lewat proxy ini.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
