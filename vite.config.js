import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.openshiftapps.com',
      'craftopia-frontend-youssefabdellah10-dev.apps.rm3.7wse.p1.openshiftapps.com'
    ]
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.openshiftapps.com',
      'craftopia-frontend-youssefabdellah10-dev.apps.rm3.7wse.p1.openshiftapps.com'
    ]
  },
  base: '/'
})