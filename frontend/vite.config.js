import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // On this Windows setup "localhost" resolves to IPv6 (::1) first, so by default Vite only
    // listened on [::1] and http://127.0.0.1:5173 was refused (ERR_CONNECTION_REFUSED).
    // Binding the IPv4 loopback makes both http://localhost:5173 and http://127.0.0.1:5173 work,
    // while keeping the dev server private to this computer (not exposed on the network).
    host: '127.0.0.1',
    port: 5173,
    open: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
