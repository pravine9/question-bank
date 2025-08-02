const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '..', 'question_banks');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

function asciiNormalize(str) {
  // remove diacritics by decomposing then stripping combining marks
  let out = str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  // approximate transliteration for common punctuation
  out = out
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '--')
    .replace(/\u2192/g, '-')
    .replace(/\u00a3/g, 'PS')
    .replace(/\u00ae/g, '(r)')
    .replace(/\u00d7/g, 'x')
    .replace(/\u00f7/g, '/')
    .replace(/\u00b0/g, 'deg')
    .replace(/\u00b1/g, '+-')
    .replace(/\u03b1/g, 'a')
    .replace(/\u03b2/g, 'b')
    .replace(/\u03bc/g, 'm')
    .replace(/\u03c4/g, 't')
    .replace(/\u2212/g, '-')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/\u221a/g, '')
    .replace(/\u2248/g, '')
    .replace(/\u2022/g, '*')
    .replace(/\u2044/g, '/')
    .replace(/\u2052/g, '%')
    .replace(/\u2714/g, '')
    .replace(/\u27a4/g, '')
    .replace(/\u25bc/g, 'V')
    .replace(/\u21d2/g, '=')
    .replace(/\u{1F4CC}/ug, '')
    .replace(/\u{1F53A}/ug, '')
    .replace(/\u{1F9E0}/ug, '')
    .replace(/\u200b/g, '');
  return out;
}

function cleanText(text) {
  if (typeof text !== 'string') return text;
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.normalize('NFKC');
  text = asciiNormalize(text);
  text = text.replace(/\u00a0/g, ' ');
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
