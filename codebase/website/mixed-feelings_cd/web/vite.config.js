import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// BASE_PATH is set by the GitHub Pages workflow to "/<repo-name>/".
// Local dev runs at http://127.0.0.1:5173/ (Spotify rejects "localhost" redirect URIs).
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
})
