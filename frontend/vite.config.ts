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
  
  // Parse API base URL to get the host and protocol
  const apiUrl = new URL(env.VITE_API_BASE_URL || 'http://localhost:7000')
  
  // Parse allowed hosts from environment variable
  const allowedHosts = env.VITE_ALLOWED_HOSTS 
    ? env.VITE_ALLOWED_HOSTS.split(',').map(host => host.trim())
    : ['localhost', '127.0.0.1']
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT) || 3000,
      host: true, // Listen on all network interfaces
      strictPort: true,
      // Use allowed hosts from environment variable
      allowedHosts: allowedHosts,
      proxy: {
        '/api': {
          target: apiUrl.toString(),
          changeOrigin: true,
          ws: true,
        },
        '/ws': {
          target: apiUrl.toString().replace(/^http/, 'ws'),
          ws: true,
        },
      },
    },
  }
})
