import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devHost = env.VITE_DEV_HOST ?? 'localhost'
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      host: devHost,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
