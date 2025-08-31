import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT) || 3000,
      proxy: {
        '/api': {
          target: `http://localhost:${env.VITE_BACKEND_PORT || 7000}`,
          changeOrigin: true,
          ws: true,
        },
        '/ws': {
          target: `ws://localhost:${env.VITE_BACKEND_PORT || 7000}`,
          ws: true,
        },
      },
    },
  }
})
