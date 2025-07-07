import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Optimize build for memory usage
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react']
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.openshiftapps.com',
      'craftopia-youssefabdellah10-dev.apps.rm3.7wse.p1.openshiftapps.com'
    ]
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.openshiftapps.com',
      'craftopia-youssefabdellah10-dev.apps.rm3.7wse.p1.openshiftapps.com'
    ]
  },
  base: '/'
})