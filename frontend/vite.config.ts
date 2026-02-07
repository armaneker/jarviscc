import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      // Force transpilation below class private fields / optional chaining
      // for older Fire OS/Silk browser engines.
      targets: [
        'chrome >= 49',
        'firefox >= 52',
        'safari >= 10',
        'ios >= 10',
      ],
      modernTargets: [
        'chrome >= 70',
        'firefox >= 68',
        'safari >= 13',
        'ios >= 13',
      ],
      modernPolyfills: true,
    }),
  ],
  server: {
    port: 5501,
  },
  preview: {
    port: 5501,
  },
})
