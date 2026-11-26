import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Local dev only: lets the browser page call /api/* on the dev server.
      // For a full local test of the mailbox proxy, run `netlify dev`
      // (it serves the frontend + netlify/functions together on port 8888).
      // Plain `npm run dev` serves the frontend only; mailbox calls will
      // fail until deployed or run via netlify dev.
      '/api': 'http://localhost:8888'
    }
  }
})
