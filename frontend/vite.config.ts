import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io'],
  },
  build: {
    sourcemap: mode !== 'production',
    minify: mode === 'production' ? 'terser' : 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'monaco-editor': ['@monaco-editor/react'],
          'markdown-vendor': ['react-markdown', 'marked'],
          'markmap-vendor': ['markmap-lib', 'markmap-view'],
          'export-vendor': ['html2pdf.js', 'mammoth']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}))
