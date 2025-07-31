const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'output';

function countQuestionsInFile(filepath) {
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error(`❌ Error reading ${filepath}: ${err}`);
    return null;
  }
}

function main() {
  const questionBankTotals = {};
  const fileCounts = [];

  const files = fs.readdirSync(OUTPUT_DIR).sort();
  for (const filename of files) {
    if (filename.endsWith('.json')) {
      const filepath = path.join(OUTPUT_DIR, filename);
      const count = countQuestionsInFile(filepath);
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
