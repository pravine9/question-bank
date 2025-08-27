import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync } from 'fs';
import { resolve } from 'path';

// Function to find built asset files
function findBuiltAsset(pattern) {
  const assetsDir = resolve('dist/assets');
  const files = readdirSync(assetsDir);
  // Look for both .js and .ts files since Vite might output .ts files
  return files.find(file => file.includes(pattern) && (file.endsWith('.js') || file.endsWith('.ts')));
}

// Function to replace imports in HTML files
function replaceImportsInFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = readFileSync(filePath, 'utf8');
  
  // Find built assets
  const mainAsset = findBuiltAsset('main-Bzh6PzLQ');
  const practiceAsset = findBuiltAsset('practice-BTCbHsDM');
  const summaryAsset = findBuiltAsset('summary-DtnDCkzv');
  const practiceHistoryAsset = findBuiltAsset('practiceHistory-Bz7lSwcg');
  
  console.log('Assets found:', { mainAsset, practiceAsset, summaryAsset, practiceHistoryAsset });
  
  // Replace imports - convert .ts to .js and update paths
  if (mainAsset) {
    const jsAsset = mainAsset.replace('.ts', '.js');
    console.log(`Converting ${mainAsset} to ${jsAsset}`);
    content = content.replace(
      new RegExp(`import\\('/question-bank/assets/${mainAsset.replace('.', '\\.')}'\\)`, 'g'),
      `import('/question-bank/assets/${jsAsset}')`
    );
  }
  
  if (practiceAsset) {
    const jsAsset = practiceAsset.replace('.ts', '.js');
    console.log(`Converting ${practiceAsset} to ${jsAsset}`);
    content = content.replace(
      new RegExp(`import\\('/question-bank/assets/${practiceAsset.replace('.', '\\.')}'\\)`, 'g'),
      `import('/question-bank/assets/${jsAsset}')`
    );
  }
  
  if (summaryAsset) {
    const jsAsset = summaryAsset.replace('.ts', '.js');
    console.log(`Converting ${summaryAsset} to ${jsAsset}`);
    content = content.replace(
      new RegExp(`import\\('/question-bank/assets/${summaryAsset.replace('.', '\\.')}'\\)`, 'g'),
      `import('/question-bank/assets/${jsAsset}')`
    );
  }
  
  if (practiceHistoryAsset) {
    const jsAsset = practiceHistoryAsset.replace('.ts', '.js');
    console.log(`Converting ${practiceHistoryAsset} to ${jsAsset}`);
    content = content.replace(
      new RegExp(`import\\('/question-bank/assets/${practiceHistoryAsset.replace('.', '\\.')}'\\)`, 'g'),
      `import('/question-bank/assets/${jsAsset}')`
    );
  }
  
  writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

// Process all template files
const templateFiles = [
  'dist/templates/index.html',
  'dist/templates/practice.html',
  'dist/templates/summary.html'
];

templateFiles.forEach(file => {
  try {
    replaceImportsInFile(file);
  } catch (error) {
    console.warn(`Could not process ${file}:`, error.message);
  }
});

// Rename .ts files to .js files
console.log('Renaming .ts files to .js files...');
const assetsDir = resolve('dist/assets');
const files = readdirSync(assetsDir);
const tsFiles = files.filter(file => file.endsWith('.ts'));

tsFiles.forEach(file => {
  const tsPath = resolve(assetsDir, file);
  const jsPath = resolve(assetsDir, file.replace('.ts', '.js'));
  
  if (existsSync(tsPath)) {
    renameSync(tsPath, jsPath);
    console.log(`Renamed ${file} to ${file.replace('.ts', '.js')}`);
  }
});

console.log('Post-build processing complete!');