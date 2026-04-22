import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/produk-code/', // PENTING: Ganti NAMA_REPO dengan nama repo Anda di GitHub
})
