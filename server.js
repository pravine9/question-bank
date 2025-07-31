const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Determine data directory
const dataDir = fs.existsSync(path.join(__dirname, 'cleaned'))
  ? path.join(__dirname, 'cleaned')
  : path.join(__dirname, 'output');

function listFiles() {
  return fs.readdirSync(dataDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(dataDir, f));
}

// Map of bank name -> array of file paths
function bankMapping() {
  const banks = {};
  for (const filePath of listFiles()) {
    let base = path.basename(filePath, '.json');
    base = base.replace('_questions', '')
               .replace('_low', '')
               .replace('_medium', '')
               .replace('_high', '');
    if (!banks[base]) banks[base] = [];
    banks[base].push(filePath);
  }
  return banks;
}

const BANKS = bankMapping();

function loadFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getQuestions(bank, num) {
  if (!BANKS[bank]) return [];
  let questions = [];
  for (const p of BANKS[bank]) {
    questions = questions.concat(loadFile(p));
  }
  // Shuffle questions
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions.slice(0, num);
}

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'templates'));

// static files
app.use('/static', express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
  const banks = Object.keys(BANKS).sort();
  res.render('index.html', { banks });
});

app.get('/launch.html', (req, res) => {
  res.render('launch.html');
});

app.get('/practice', (req, res) => {
  const bank = req.query.bank;
  const num = parseInt(req.query.num || '10', 10);
  if (!BANKS[bank]) {
    return res.render('practice.html', { questions: [], bank: null });
  }
  const questions = getQuestions(bank, num);
  res.render('practice.html', { questions, bank });
});

app.get('/htmlDelivery/index.html', (req, res) => {
  const banks = Object.keys(BANKS).sort();
  res.render('index.html', { banks });
});

app.get('/question', (req, res) => {
  const bank = req.query.bank;
  if (!BANKS[bank]) {
    return res.status(404).json({ error: 'unknown bank' });
  }
  const file = BANKS[bank][Math.floor(Math.random() * BANKS[bank].length)];
  const data = loadFile(file);
  const q = data[Math.floor(Math.random() * data.length)];
  res.json(q);
});

app.get('/bank_questions', (req, res) => {
  const bank = req.query.bank;
  if (!BANKS[bank]) {
    return res.status(404).json({ error: 'unknown bank' });
  }
  let questions = [];
  for (const p of BANKS[bank]) {
    questions = questions.concat(loadFile(p));
  }
  questions.sort((a, b) => (a.id || 0) - (b.id || 0));
  res.json(questions);
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
