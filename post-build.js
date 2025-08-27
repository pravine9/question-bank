import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';
import { glob } from 'glob';

// Rename TypeScript files to JavaScript files
function renameTsFiles() {
  console.log('Renaming TypeScript files to JavaScript...');
  
  const tsFiles = glob.sync('dist/assets/*.ts');
  tsFiles.forEach(file => {
    const jsFile = file.replace('.ts', '.js');
    if (existsSync(file)) {
      renameSync(file, jsFile);
      console.log(`Renamed ${file} to ${jsFile}`);
    }
  });
}

// Update HTML files to reference .js files instead of .ts files
function updateHtmlFiles() {
  console.log('Updating HTML files...');
  
  const htmlFiles = glob.sync('dist/templates/*.html');
  htmlFiles.forEach(file => {
    let content = readFileSync(file, 'utf8');
    
    // Replace .ts imports with .js imports
    content = content.replace(/\.ts(['"])/g, '.js$1');
    
    writeFileSync(file, content);
    console.log(`Updated ${file}`);
  });
}

// Main function
function main() {
  try {
    renameTsFiles();
    updateHtmlFiles();
    console.log('Post-build processing completed successfully!');
  } catch (error) {
    console.error('Post-build processing failed:', error);
    process.exit(1);
  }
}

main();
