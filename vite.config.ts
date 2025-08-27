import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

export default defineConfig({
  base: '/question-bank/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'templates/index.html'),
        practice: resolve(__dirname, 'templates/practice.html'),
        summary: resolve(__dirname, 'templates/summary.html'),
        'static/main': resolve(__dirname, 'static/main.ts'),
        'static/practice': resolve(__dirname, 'static/practice.ts'),
        'static/summary': resolve(__dirname, 'static/summary.ts')
      },
      external: [
        '/question_banks/calculations_questions.js',
        '/question_banks/clinical_mep_low_questions.js',
        '/question_banks/clinical_mixed_high_questions.js',
        '/question_banks/clinical_mixed_low_questions.js',
        '/question_banks/clinical_mixed_medium_questions.js',
        '/question_banks/clinical_otc_low_questions.js',
        '/question_banks/clinical_therapeutics_high_questions.js',
        '/question_banks/clinical_therapeutics_low_questions.js',
        '/question_banks/clinical_therapeutics_medium_questions.js'
      ]
    },
    target: 'es2015',
    minify: 'terser',
    sourcemap: true,
    copyPublicDir: true
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true
    }),
    {
      name: 'copy-question-banks',
      writeBundle() {
        try {
          // Copy question banks (these are already JavaScript files)
          const distQuestionBanks = 'dist/question_banks';
          if (!existsSync(distQuestionBanks)) {
            mkdirSync(distQuestionBanks, { recursive: true });
          }
          const questionBankFiles = readdirSync('public/question_banks').filter(f => f.endsWith('.js'));
          questionBankFiles.forEach(file => {
            copyFileSync(`public/question_banks/${file}`, `${distQuestionBanks}/${file}`);
          });
        } catch (error) {
          console.warn('Failed to copy question banks:', error);
        }
      }
    },

  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@templates': resolve(__dirname, 'templates'),
      '@question-banks': resolve(__dirname, 'public/question_banks')
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
