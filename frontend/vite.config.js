import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 9990,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:9200',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep framework code in its own chunk, separate from app code and
          // from three.js (already its own async chunk). Vue/vue-router change
          // far less often than the app itself, so browsers can cache this
          // chunk across deploys instead of re-downloading it every time.
          if (id.includes('node_modules/vue') || id.includes('node_modules/@vue')) return 'vendor'
        },
      },
    },
  },
})
