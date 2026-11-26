import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Local dev only: lets the browser page call /api/* on the dev server,
      // which forwards to the Vercel-style functions in /api (run `vercel dev`
      // for a full local test of the proxy). Plain `npm run dev` serves the
      // frontend only; mailbox calls will fail until deployed or run via vercel dev.
      '/api': 'http://localhost:3000'
    }
  }
})
