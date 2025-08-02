document.getElementById('loadBtn').addEventListener('click', loadQuestion);
const practiceBtn = document.getElementById('practiceBtn');
if (practiceBtn) practiceBtn.addEventListener('click', startPractice);
let currentQuestion;
let selected;
let bankFiles = null;

function populateBankSelects(data) {
  const bankSelect = document.getElementById('bankSelect');
  const statsSelect = document.getElementById('statsBankSelect');
  if (!bankSelect && !statsSelect) return;
  const names = Object.keys(data)
    .filter(k => Array.isArray(data[k]))
    .sort();
  names.forEach(name => {
    if (bankSelect) {
      const opt1 = document.createElement('option');
      opt1.value = name;
      opt1.textContent = name;
      bankSelect.appendChild(opt1);
    }
    if (statsSelect) {
      const opt2 = document.createElement('option');
      opt2.value = name;
      opt2.textContent = name;
      statsSelect.appendChild(opt2);
    }
  });
}

// Adjust layout when loaded in standalone mode
document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('isStandAlone') === 'true') {
    document.body.classList.add('standalone');
    const container = document.querySelector('.container');
    if (container) container.classList.add('standalone');
  }
  if (!bankFiles) {
    fetch('../static/banks.json')
      .then(r => r.json())
      .then(data => {
        bankFiles = data;
        populateBankSelects(bankFiles);
      });
  } else {
    populateBankSelects(bankFiles);
  }
});

async function loadQuestion() {
  const bank = document.getElementById('bankSelect').value;
  if (!bank) return;
  if (!bankFiles) {
    bankFiles = await fetch('../static/banks.json').then(r => r.json());
  }
  const files = bankFiles[bank] || [];
  if (!files.length) return;
  const file = files[Math.floor(Math.random() * files.length)];
  const qs = await fetch('../' + file).then(r => r.json());
  const q = qs[Math.floor(Math.random() * qs.length)];
  renderQuestion(q);
}

function startPractice() {
  const bank = document.getElementById('bankSelect').value;
  const num = parseInt(document.getElementById('numInput').value, 10);
  if (!bank) {
    alert('Please select a bank');
    return;
  }
  if (!num || num <= 0) {
    alert('Please enter a positive number of questions');
    return;
  }
  window.location.href = `/templates/practice.html?bank=${encodeURIComponent(bank)}&num=${num}`;
}

function renderQuestion(q) {
  currentQuestion = q;
  selected = null;
  document.getElementById('questionArea').style.display = 'block';
  const result = questionRenderer.renderQuestion(q, {
    text: '#qText',
    title: '#qTitle',
    img: '#qImg',
    options: '#answerOptions',
    input: '#calcInput',
    unit: '#answerUnit',
    feedback: '#feedback',
    answer: '#answer',
    explanation: '#explanation',
    showInput: true
  });
  const options = document.getElementById('answerOptions');
  if (q.answers && q.answers.length) {
    result.buttons.forEach(btn => {
      btn.onclick = () => {
        options.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selected = btn.dataset.num;
      };
    });
  }
}

document.getElementById('checkBtn').onclick = function() {
  if (!currentQuestion) return;
  const options = document.getElementById('answerOptions');
  const input = document.getElementById('calcInput');
  const feedback = document.getElementById('feedback');
  const value = currentQuestion.answers && currentQuestion.answers.length ? selected : input.value.trim();
  questionRenderer.evaluateAnswer(currentQuestion, value, { options, feedback });
};

document.getElementById('revealBtn').onclick = function() {
  if (!currentQuestion) return;
  questionRenderer.revealAnswer(currentQuestion, { answer: '#answer', explanation: '#explanation' });
};

document.getElementById('saveBtn').onclick = function() {
  if (!currentQuestion) return;
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  if (!data[currentQuestion.id]) data[currentQuestion.id] = {right:0, wrong:0, saved:false};
  data[currentQuestion.id].saved = !data[currentQuestion.id].saved;
  localStorage.setItem('questionStats', JSON.stringify(data));
  alert(data[currentQuestion.id].saved ? 'Saved!' : 'Removed!');
};


let statsQuestions = [];
const loadStatsBtn = document.getElementById('loadStatsBtn');
if (loadStatsBtn) loadStatsBtn.addEventListener('click', loadStats);

function loadStats() {
  const bank = document.getElementById('statsBankSelect').value;
  if (!bank) return;
  (async () => {
      if (!bankFiles) {
        bankFiles = await fetch('../static/banks.json').then(r => r.json());
      }
      const files = bankFiles[bank] || [];
      let qs = [];
      for (const f of files) {
        const arr = await fetch('../' + f).then(r => r.json());
        qs = qs.concat(arr);
      }
      statsQuestions = qs.sort((a,b) => (a.id||0) - (b.id||0));
      renderStats();
    })();
  }

function renderStats() {
  const tbody = document.querySelector('#statsTable tbody');
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  tbody.textContent = '';
  statsQuestions.forEach(q => {
    const stats = data[q.id] || {right:0, wrong:0};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${q.id}</td><td>${stats.right + stats.wrong}</td><td>${stats.right}</td><td>${stats.wrong}</td><td><button data-id="${q.id}">View</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button[data-id]').forEach(btn => {
    btn.onclick = () => showStatsQuestion(btn.getAttribute('data-id'));
  });
}

function showStatsQuestion(id) {
  const q = statsQuestions.find(x => String(x.id) === String(id));
  if (!q) return;
  const overlay = document.getElementById('statsModal');
  overlay.style.display = 'flex';
  questionRenderer.renderQuestion(q, {
    text: '#sqText',
    title: '#sqTitle',
    img: '#sqImg',
    answer: '#sqAnswer',
    explanation: '#sqExplanation',
    showInput: false
  });
  const revealBtn = document.getElementById('sqRevealBtn');
  revealBtn.textContent = 'Reveal Answer';
  revealBtn.onclick = () => revealStatsQuestion(q);
}

document.getElementById('sqCloseBtn').onclick = function() {
  document.getElementById('statsModal').style.display = 'none';
};

function revealStatsQuestion(q) {
  const ans = document.getElementById('sqAnswer');
  const ex = document.getElementById('sqExplanation');
  const btn = document.getElementById('sqRevealBtn');

  if (ans.style.display === 'block') {
    ans.style.display = 'none';
    ex.style.display = 'none';
    btn.textContent = 'Reveal Answer';
    return;
  }
  questionRenderer.revealAnswer(q, { answer: ans, explanation: ex });
  btn.textContent = 'Hide Answer';
}
