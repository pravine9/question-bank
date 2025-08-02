const fs = require('fs');
const path = require('path');
const { sanitize } = require('../static/question_renderer.js');

const INPUT_DIR = path.join(__dirname, '..', 'question_banks');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Map of problematic Unicode characters to their ASCII approximations
const CHAR_MAP = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '--',
  '\u2192': '-',
  '\u00A3': 'PS',
  '\u00AE': '(r)',
  '\u00D7': 'x',
  '\u00F7': '/',
  '\u00B0': 'deg',
  '\u00B1': '+-',
  '\u03B1': 'a',
  '\u03B2': 'b',
  '\u03BC': 'm',
  '\u03C4': 't',
  '\u2212': '-',
  '\u2264': '<=',
  '\u2265': '>=',
  '\u221A': '',
  '\u2248': '',
  '\u2022': '*',
  '\u2044': '/',
  '\u2052': '%',
  '\u2714': '',
  '\u27A4': '',
  '\u25BC': 'V',
  '\u21D2': '=',
  '\u{1F4CC}': '',
  '\u{1F53A}': '',
  '\u{1F9E0}': '',
  '\u200B': ''
};

function asciiNormalize(str) {
  // remove diacritics by decomposing then stripping combining marks
  let out = str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  // approximate transliteration for common punctuation
  for (const [char, replacement] of Object.entries(CHAR_MAP)) {
    out = out.replace(new RegExp(char, 'gu'), replacement);
  }
  return out;
}

function cleanText(text) {
  if (typeof text !== 'string') return text;
  text = sanitize(text);
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.normalize('NFKC');
  text = asciiNormalize(text);
  if (text.startsWith('**') && text.endsWith('**')) {
    text = text.slice(2, -2).trim();
  }
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

function processFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const q of data) {
    for (const key of ['title', 'text', 'why', 'correct_answer']) {
      if (q[key]) {
        q[key] = cleanText(q[key]);
      }
    }
    if (Array.isArray(q.answers)) {
      for (const ans of q.answers) {
        if (ans.text) {
          ans.text = cleanText(ans.text);
        }
      }
    }
  }
  return data;
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  for (const file of fs.readdirSync(INPUT_DIR)) {
    if (file.endsWith('.json')) {
      const cleaned = processFile(path.join(INPUT_DIR, file));
      const outPath = path.join(OUTPUT_DIR, file);
      fs.writeFileSync(outPath, JSON.stringify(cleaned, null, 2), 'utf8');
      console.log(`Wrote ${outPath}`);
    }
  }
}

if (require.main === module) {
  main();
}
