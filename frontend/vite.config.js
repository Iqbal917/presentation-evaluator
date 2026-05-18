import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    proxy: {
      '/upload_video': 'http://127.0.0.1:5000',
      '/video_feed': 'http://127.0.0.1:5000',
      '/download-report': 'http://127.0.0.1:5000',
      '/static': 'http://127.0.0.1:5000',

      '/auth': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
      '/start-evaluation': 'http://localhost:5000',
      '/stop-evaluation': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    }
  }
})

