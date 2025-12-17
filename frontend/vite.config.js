import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'  // ← needed for reading key/cert files

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    https: {
      key: fs.readFileSync('/home/dhyan/ssl/mykey.key'),
      cert: fs.readFileSync('/home/dhyan/ssl/mycert.crt')
    },
    allowedHosts: ['aurora.com']
  }
})

