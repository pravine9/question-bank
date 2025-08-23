import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'templates/index.html'),
        practice: resolve(__dirname, 'templates/practice.html'),
        summary: resolve(__dirname, 'templates/summary.html'),
        banks: resolve(__dirname, 'src/pages/banks.ts'),
        question_renderer: resolve(__dirname, 'src/pages/question_renderer.ts'),
        main_script: resolve(__dirname, 'src/pages/main.ts'),
        practice_script: resolve(__dirname, 'src/pages/practice.ts'),
        summary_script: resolve(__dirname, 'src/pages/summary.ts')
      }
    },
    target: 'es2015',
    minify: 'terser',
    sourcemap: true,
    copyPublicDir: true
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    {
      name: 'copy-assets',
      writeBundle() {
        try {
          // Copy question banks
          const distQuestionBanks = 'dist/question_banks';
          if (!existsSync(distQuestionBanks)) {
            mkdirSync(distQuestionBanks, { recursive: true });
          }
          const questionBankFiles = readdirSync('question_banks').filter(f => f.endsWith('.js'));
          questionBankFiles.forEach(file => {
            copyFileSync(`question_banks/${file}`, `${distQuestionBanks}/${file}`);
          });
            // Copy src components
          const distSrcComponents = 'dist/src/components';
          if (!existsSync(distSrcComponents)) {
            mkdirSync(distSrcComponents, { recursive: true });
          }
          if (existsSync('src/components')) {
            const componentFiles = readdirSync('src/components').filter(f => f.endsWith('.js'));
            componentFiles.forEach(file => {
              copyFileSync(`src/components/${file}`, `${distSrcComponents}/${file}`);
            });
          }
        } catch (error) {
          console.warn('Failed to copy assets:', error);
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),

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
