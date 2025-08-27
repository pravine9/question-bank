import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/question-bank/' : '/',
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        practice: resolve(__dirname, 'src/practice.html'),
        summary: resolve(__dirname, 'src/summary.html')
      },
      external: [
        '../public/question_banks/calculations_questions.js',
        '../public/question_banks/clinical_mep_low_questions.js',
        '../public/question_banks/clinical_mixed_high_questions.js',
        '../public/question_banks/clinical_mixed_low_questions.js',
        '../public/question_banks/clinical_mixed_medium_questions.js',
        '../public/question_banks/clinical_otc_low_questions.js',
        '../public/question_banks/clinical_therapeutics_high_questions.js',
        '../public/question_banks/clinical_therapeutics_low_questions.js',
        '../public/question_banks/clinical_therapeutics_medium_questions.js'
      ]
    },
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    copyPublicDir: true
  },
  plugins: [
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
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@templates': resolve(__dirname, 'src/templates'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'src/assets'),
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
