import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'templates/index.html'),
        practice: resolve(__dirname, 'templates/practice.html')
      }
    },
    target: 'es2015',
    minify: 'terser',
    sourcemap: true
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@static': resolve(__dirname, 'static'),
      '@templates': resolve(__dirname, 'templates'),
      '@question-banks': resolve(__dirname, 'question_banks')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  }
});
