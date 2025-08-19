const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
let fetch;
try {
  fetch = require('node-fetch');
} catch (err) {
  // fallback to built in fetch if node-fetch isn't available
  fetch = global.fetch;
}

const BANK_CHOICES = [
  'Calculations',
  'Clinical Therapeutics',
  'Clinical MEP',
  'Clinical OTC',
  'Clinical Mixed'
];

const WEIGHTING_CHOICES = ['Low', 'Medium', 'High'];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function promptForBank() {
  console.log('Select a question bank:');
  BANK_CHOICES.forEach((name, i) => console.log(`${i + 1}. ${name}`));
  while (true) {
    const ans = await ask('Enter number: ');
    const idx = parseInt(ans, 10);
    if (idx >= 1 && idx <= BANK_CHOICES.length) return BANK_CHOICES[idx - 1];
    console.log('Invalid input. Try again.');
  }
}

async function promptForWeighting() {
  console.log('Select a weighting:');
  WEIGHTING_CHOICES.forEach((name, i) => console.log(`${i + 1}. ${name}`));
  while (true) {
    const ans = await ask('Enter number: ');
    const idx = parseInt(ans, 10);
    if (idx >= 1 && idx <= WEIGHTING_CHOICES.length) return WEIGHTING_CHOICES[idx - 1];
    console.log('Invalid input. Try again.');
  }
}

function hashQuestion(q) {
  return crypto
    .createHash('sha256')
    .update((q.title || '') + (q.text || ''))
    .digest('hex');
}

async function fetchBatch(url, headers) {
  try {
    const res = await fetch(url, { headers });
    const text = await res.text();
    return JSON.parse(text);
  } catch (err) {
    console.log('❌ Failed to decode JSON');
    return [];
  }
}

async function main() {
  const bankName = await promptForBank();
  let weighting = null;
  let url;
  let outputFile;

  if (bankName === 'Calculations') {
    console.log(`\n📥 Scraping '${bankName}' questions (no weighting)...\n`);
    outputFile = path.join('question_banks', `${bankName.toLowerCase().replace(/ /g, '_')}_questions.js`);
    url = `https://www.preregshortcuts.com/api/questions/get/?bank=${bankName.replace(/ /g, '+')}&num_questions=40`;
  } else {
    weighting = await promptForWeighting();
    console.log(`\n📥 Scraping '${bankName}' questions with '${weighting}' weighting...\n`);
    outputFile = path.join('question_banks', `${bankName.toLowerCase().replace(/ /g, '_')}_${weighting.toLowerCase()}_questions.js`);
    url = `https://www.preregshortcuts.com/api/questions/get/?bank=${bankName.replace(/ /g, '+')}&num_questions=40&weighting=${weighting}`;
  }

  fs.mkdirSync('question_banks', { recursive: true });

  const headers = {
    'Host': 'www.preregshortcuts.com',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'X-Csrftoken': 'fdwcLsSXop1Bpzupit3KItF6cDNVSJ7S',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Accept': 'application/json, text/plain, */*',
    'Sec-Ch-Ua': '"Not)A;Brand";v="8", "Chromium";v="138"',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    'Sec-Ch-Ua-Mobile': '?0', // Browser compatibility header
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': `https://www.preregshortcuts.com/question-bank/quiz/${bankName.toLowerCase().replace(/ /g, '-')}/`,
    'Accept-Encoding': 'gzip, deflate, br',
    'Priority': 'u=1, i',
    'Connection': 'keep-alive',
    'Cookie': 'cookies_accepted_categories=technically_required,analytics; _ga=GA1.1.1762998342.1753816009; csrftoken=fdwcLsSXop1Bpzupit3KItF6cDNVSJ7S; sessionid=mqloafb1vcqt00hspwv4eg681kl87t4m; __stripe_mid=d458e04e-aee5-4ea2-a54e-137944451c30d2a9de; __stripe_sid=04313b41-ba0c-4c48-b748-baaf406d6083d6e8b9'
  };

  let uniqueQuestions = [];
  let seenHashes = new Set();
  const weightingText = weighting ? ` with weighting '${weighting}'` : '';

  if (fs.existsSync(outputFile)) {
    try {
      const code = fs.readFileSync(outputFile, 'utf8');
      const mod = await import('data:text/javascript,' + encodeURIComponent(code));
      uniqueQuestions = Array.isArray(mod.default) ? mod.default : [];
      seenHashes = new Set(uniqueQuestions.map(hashQuestion));
      console.log(`🔁 Loaded ${uniqueQuestions.length} existing unique questions for bank '${bankName}'${weightingText}.`);
    } catch (err) {
      console.log('⚠️ Failed to load existing data — starting fresh.');
    }
  }

  let noNewCount = 0;
  let batchNum = 0;

  while (true) {
    batchNum += 1;
    console.log(`\n🔄 Batch ${batchNum} for bank '${bankName}'${weightingText}...`);
    const batch = await fetchBatch(url, headers);
    if (!batch || batch.length === 0) break;

    let added = 0;
    for (const q of batch) {
      const h = hashQuestion(q);
      if (!seenHashes.has(h)) {
        seenHashes.add(h);
        uniqueQuestions.push(q);
        added += 1;
      }
    }

    console.log(`✅ Added ${added} unique of ${batch.length}`);
    console.log(`📊 Total unique questions so far for bank '${bankName}'${weightingText}: ${uniqueQuestions.length}`);

    if (added === 0) {
      noNewCount += 1;
      console.log(`⚠️ No new questions found. (${noNewCount}/10)`);
    } else {
      noNewCount = 0;
    }

    if (noNewCount >= 10) {
      console.log(`🛑 No new questions for 10 batches for bank '${bankName}'${weightingText} — stopping.`);
      break;
    }

    await new Promise(res => setTimeout(res, 2000));
  }

  fs.writeFileSync(outputFile, 'export default ' + JSON.stringify(uniqueQuestions, null, 2));
  console.log(`\n💾 Saved ${uniqueQuestions.length} unique questions to ${outputFile}`);
  rl.close();
}

main();
