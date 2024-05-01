import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import path, { dirname } from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue({ customElement: true })],
  define: {
    'process.env': {},
  },
  server: {
    hmr: true,
  },
  proxy: {
    '/api': {
      target: `http://localhost:80`,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/api'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(dirname(fileURLToPath(import.meta.url)), './widget/widget.js'),
      name: 'feedback-widget',
      fileName: (format) => `widget.${format}.js`,
    },
    outDir: './dist',
    emptyOutDir: true,
    minify: true,
  },
})
