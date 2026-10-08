import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// A ordem dos plugins importa: o gerador de rotas precisa rodar antes do plugin
// do React, senao a geracao e o code-splitting falham em silencio.
export default defineConfig({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true, target: 'react' }),
    tailwindcss(),
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  server: {
    // Prende o dev no loopback IPv4: sem `host` o Vite escuta so em `::1`,
    // e navegador que resolve `localhost` para `127.0.0.1` recebe
    // ERR_CONNECTION_REFUSED no reload. `strictPort` impede a migracao
    // silenciosa para outra porta, que quebraria o CORS do backend,
    // travado na 4174.
    host: '127.0.0.1',
    port: 4174,
    strictPort: true
  }
})
