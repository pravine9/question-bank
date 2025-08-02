#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

const OUTPUT_DIR = 'question_banks';

async function countQuestionsInFile(filepath) {
  try {
    const code = await fs.readFile(filepath, 'utf-8');
    const mod = await import('data:text/javascript,' + encodeURIComponent(code));
    const data = mod.default;
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error(`❌ Error reading ${filepath}: ${err}`);
    return null;
  }
}

async function main() {
  const questionBankTotals = {};
  const fileCounts = [];

  const files = (await fs.readdir(OUTPUT_DIR)).sort();
  for (const filename of files) {
    if (filename.endsWith('.js')) {
      const filepath = path.join(OUTPUT_DIR, filename);
      const count = await countQuestionsInFile(filepath);
      if (count !== null) {
        fileCounts.push([filename, count]);
        const bankName = filename.split('_questions')[0];
        questionBankTotals[bankName] = (questionBankTotals[bankName] || 0) + count;
      }
    }
  }

  console.log('\n🧮 Total questions by bank (by file):\n');
  const sortedBanks = Object.keys(questionBankTotals).sort();
  for (const bankName of sortedBanks) {
    console.log(`${bankName}: ${questionBankTotals[bankName]} questions`);
  }

  const combinedTotals = {};
  for (const [bankName, count] of Object.entries(questionBankTotals)) {
    const baseBank = bankName
      .replace('_low', '')
      .replace('_medium', '')
      .replace('_high', '')
      .replace('_questions', '');
    combinedTotals[baseBank] = (combinedTotals[baseBank] || 0) + count;
  }

  console.log('\n📦 Combined total questions per bank:\n');
  const sortedCombined = Object.keys(combinedTotals).sort();
  for (const baseBank of sortedCombined) {
    console.log(`${baseBank}: ${combinedTotals[baseBank]} questions`);
  }
}

if (require.main === module) {
  main();
}
