import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'fabric': ['fabric'],
          'ui-libs': ['lucide-react', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
