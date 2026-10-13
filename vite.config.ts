import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // A dónde reenvía el front las llamadas /api en desarrollo (por defecto el backend local).
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:4000'
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': apiTarget,
        // Cuando existan las 3 APIs separadas, se puede enrutar por prefijo, por ejemplo:
        // '/api/personas':  'http://localhost:4101',
        // '/api/academico': 'http://localhost:4102',
        // '/api/formatos':  'http://localhost:4103',
        // (declara los prefijos más específicos ANTES que '/api')
      },
    },
  }
})
