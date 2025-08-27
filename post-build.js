import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// Function to find built asset files
function findBuiltAsset(pattern) {
  const assetsDir = resolve('dist/assets');
  const files = readdirSync(assetsDir);
  // Look for .js files (Vite should have already compiled TypeScript to JavaScript)
  const jsFile = files.find(file => file.includes(pattern) && file.endsWith('.js'));
  return jsFile;
}

// Function to replace imports in HTML files
function replaceImportsInFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = readFileSync(filePath, 'utf8');
  
  // Find built assets
  const mainAsset = findBuiltAsset('main');
  const practiceAsset = findBuiltAsset('practice');
  const summaryAsset = findBuiltAsset('summary');
  const practiceHistoryAsset = findBuiltAsset('practiceHistory');
  
  console.log('Assets found:', { mainAsset, practiceAsset, summaryAsset, practiceHistoryAsset });
  
  // Fix question bank script paths for production
  content = content.replace(
    /src="\.\.\/public\/question_banks\//g,
    'src="/question-bank/question_banks/'
  );
  
  // Remove type="module" from question bank scripts for production
  content = content.replace(
    /<script type="module" src="\/question-bank\/question_banks\//g,
    '<script src="/question-bank/question_banks/'
  );
  
  writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

// Process all template files
const templateFiles = [
  'dist/index.html',
  'dist/practice.html',
  'dist/summary.html'
];

templateFiles.forEach(file => {
  try {
    replaceImportsInFile(file);
  } catch (error) {
    console.warn(`Could not process ${file}:`, error.message);
  }
});

console.log('Post-build processing complete!');