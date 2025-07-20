import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  server: {
    port: 5173, // Or whatever port Vite is running on
    proxy: {
      '/api': { // Any request starting with /api
        target: 'http://localhost:5000', // Proxy to your Node.js backend
        changeOrigin: true,
        secure: false, // Set to true if your backend uses HTTPS (not by default)
        // rewrite: (path) => path.replace(/^\/api/, '') // Use this if your backend routes don't start with /api
      }
    }
  }
});