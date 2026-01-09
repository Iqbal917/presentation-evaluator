import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss(),],
  server: {
    proxy: {
      // '/api': 'http://127.0.0.1:8000',
      // '/start-evaluation': 'http://127.0.0.1:8000',
      // '/stop-evaluation': 'http://127.0.0.1:8000',
      '/upload_video': 'http://127.0.0.1:8000',
      '/video_feed': 'http://127.0.0.1:8000',
      '/download-report': 'http://127.0.0.1:8000',
      '/static': 'http://127.0.0.1:8000',

      '/auth': 'http://localhost:8000',
      '/api': 'http://localhost:8000',
      '/start-evaluation': 'http://localhost:8000',
      '/stop-evaluation': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  }
})

