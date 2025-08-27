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
  const mainAsset = findBuiltAsset('main');
  const practiceAsset = findBuiltAsset('practice');
  const summaryAsset = findBuiltAsset('summary');
  const practiceHistoryAsset = findBuiltAsset('practiceHistory');
  
  console.log('Assets found:', { mainAsset, practiceAsset, summaryAsset, practiceHistoryAsset });
  
  // Replace imports - convert .ts to .js and update paths
  if (mainAsset) {
    console.log(`Converting ${mainAsset} import`);
    content = content.replace(
      new RegExp(`import\\('/question-bank/assets/${mainAsset.replace('.js', '.ts')}'\\)`, 'g'),
      `import('/question-bank/assets/${mainAsset}')`
    );
  }
  
  if (practiceAsset) {
    console.log(`Converting ${practiceAsset} import`);
    content = content.replace(
      new RegExp(`import\\('/question-bank/assets/${practiceAsset.replace('.js', '.ts')}'\\)`, 'g'),
      `import('/question-bank/assets/${practiceAsset}')`
    );
  }
  
  if (summaryAsset) {
    console.log(`Converting ${summaryAsset} import`);
    content = content.replace(
      new RegExp(`import\\('/question-bank/assets/${summaryAsset.replace('.js', '.ts')}'\\)`, 'g'),
      `import('/question-bank/assets/${summaryAsset}')`
    );
  }
  
  if (practiceHistoryAsset) {
    console.log(`Converting ${practiceHistoryAsset} import`);
    content = content.replace(
      new RegExp(`import\\('/question-bank/assets/${practiceHistoryAsset.replace('.js', '.ts')}'\\)`, 'g'),
      `import('/question-bank/assets/${practiceHistoryAsset}')`
    );
  }
  
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