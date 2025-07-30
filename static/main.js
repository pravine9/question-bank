document.getElementById('loadBtn').addEventListener('click', loadQuestion);
const practiceBtn = document.getElementById('practiceBtn');
if (practiceBtn) practiceBtn.addEventListener('click', startPractice);
let currentQuestion;
let selected;

// Adjust layout when loaded in standalone mode
document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('isStandAlone') === 'true') {
    document.body.classList.add('standalone');
    const container = document.querySelector('.container');
    if (container) container.classList.add('standalone');
  }
});

function loadQuestion() {
  const bank = document.getElementById('bankSelect').value;
  if (!bank) return;
  fetch(`/question?bank=${bank}`)
    .then(r => r.json())
    .then(renderQuestion);
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
  window.location.href = `/practice?bank=${encodeURIComponent(bank)}&num=${num}`;
}

function renderQuestion(q) {
  currentQuestion = q;
  selected = null;
  document.getElementById('questionArea').style.display = 'block';
  document.getElementById('qTitle').textContent = q.title || '';
  const text = (q.text || '')
    .replace(/\u2028/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '');
  document.getElementById('qText').innerHTML =
    DOMPurify.sanitize(marked.parse(text));
  const img = document.getElementById('qImg');
  if (q.resource_image) { img.src = q.resource_image; img.style.display='block'; } else { img.style.display='none'; }
  const options = document.getElementById('answerOptions');
  options.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  options.textContent = '';
  const calcInput = document.getElementById('calcInput');
  const answerUnit = document.getElementById('answerUnit');
  calcInput.style.display = 'none';
  answerUnit.style.display = 'none';
  if (q.answers && q.answers.length) {
    q.answers.forEach(a => {
      const btn = document.createElement('button');
      btn.textContent = a.text;
      btn.dataset.num = a.answer_number;
      btn.onclick = () => {
        options.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selected = a.answer_number;
      };
      options.appendChild(btn);
    });
  } else {
    calcInput.style.display = 'block';
    if (q.answer_unit) {
      answerUnit.textContent = q.answer_unit;
      answerUnit.style.display = 'inline';
    } else {
      answerUnit.style.display = 'none';
    }
  }
  const feedback = document.getElementById('feedback');
  feedback.textContent = '';
  feedback.className = '';
  document.getElementById('explanation').style.display = 'none';
  const ans = document.getElementById('answer');
  if (ans) {
    ans.textContent = '';
    ans.style.display = 'none';
  }
}

document.getElementById('checkBtn').onclick = function() {
  if (!currentQuestion) return;
  const options = document.getElementById('answerOptions');
  let correct = false;
  if (currentQuestion.answers && currentQuestion.answers.length) {
    correct = selected == currentQuestion.correct_answer_number;
    options.querySelectorAll('button').forEach(b => b.disabled = true);
    const correctBtn = options.querySelector(`button[data-num='${currentQuestion.correct_answer_number}']`);
    if (correctBtn) correctBtn.classList.add('correct');
  } else {
    const value = document.getElementById('calcInput').value.trim();
    correct = value === (currentQuestion.correct_answer || '');
  }
  const feedback = document.getElementById('feedback');
  feedback.textContent = correct ? 'Correct!' : 'Incorrect';
  feedback.className = correct ? 'correct' : 'incorrect';
  updateStats(currentQuestion.id, correct);
};

document.getElementById('revealBtn').onclick = function() {
  if (!currentQuestion) return;
  let answerText = '';
  if (currentQuestion.answers && currentQuestion.answers.length) {
    const obj = currentQuestion.answers.find(a => a.answer_number == currentQuestion.correct_answer_number);
    answerText = obj ? obj.text : '';
  } else {
    answerText = currentQuestion.correct_answer || '';
    if (currentQuestion.answer_unit) {
      answerText += ' ' + currentQuestion.answer_unit;
    }
  }
  const ans = document.getElementById('answer');
  if (ans) {
    ans.textContent = answerText ? `Answer: ${answerText}` : '';
    ans.style.display = 'block';
  }
  const ex = document.getElementById('explanation');
  const why = (currentQuestion.why || '')
    .replace(/\u2028/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '');
  ex.innerHTML = DOMPurify.sanitize(marked.parse(why || 'No explanation'));
  ex.style.display = 'block';
};

document.getElementById('saveBtn').onclick = function() {
  if (!currentQuestion) return;
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  if (!data[currentQuestion.id]) data[currentQuestion.id] = {right:0, wrong:0, saved:false};
  data[currentQuestion.id].saved = !data[currentQuestion.id].saved;
  localStorage.setItem('questionStats', JSON.stringify(data));
  alert(data[currentQuestion.id].saved ? 'Saved!' : 'Removed!');
};

function updateStats(id, correct) {
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  if (!data[id]) data[id] = {right:0, wrong:0, saved:false};
  if (correct) data[id].right++; else data[id].wrong++;
  localStorage.setItem('questionStats', JSON.stringify(data));
}

let statsQuestions = [];
const loadStatsBtn = document.getElementById('loadStatsBtn');
if (loadStatsBtn) loadStatsBtn.addEventListener('click', loadStats);

function loadStats() {
  const bank = document.getElementById('statsBankSelect').value;
  if (!bank) return;
  fetch(`/bank_questions?bank=${bank}`)
    .then(r => r.json())
    .then(qs => { statsQuestions = qs; renderStats(); });
}

function renderStats() {
  const tbody = document.querySelector('#statsTable tbody');
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  tbody.textContent = '';
  statsQuestions.forEach(q => {
    const stats = data[q.id] || {right:0, wrong:0};
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${q.id}</td><td>${stats.right + stats.wrong}</td><td>${stats.right}</td><td>${stats.wrong}</td><td><button data-id="${q.id}">View</button>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('button[data-id]').forEach(btn => {
    btn.onclick = () => showStatsQuestion(btn.getAttribute('data-id'));
  });
}

function showStatsQuestion(id) {
  const q = statsQuestions.find(x => String(x.id) === String(id));
  if (!q) return;
  document.getElementById('statsQuestionArea').style.display = 'block';
  document.getElementById('sqTitle').textContent = q.title || '';
  const text = (q.text || '')
    .replace(/\u2028/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '');
  document.getElementById('sqText').innerHTML = DOMPurify.sanitize(marked.parse(text));
  document.getElementById('sqAnswer').style.display = 'none';
  document.getElementById('sqExplanation').style.display = 'none';
  document.getElementById('sqAnswer').textContent = '';
  document.getElementById('sqExplanation').textContent = '';
  document.getElementById('sqRevealBtn').onclick = () => revealStatsQuestion(q);
}

function revealStatsQuestion(q) {
  let answerText = '';
  if (q.answers && q.answers.length) {
    const obj = q.answers.find(a => a.answer_number == q.correct_answer_number);
    answerText = obj ? obj.text : '';
  } else {
    answerText = q.correct_answer || '';
    if (q.answer_unit) answerText += ' ' + q.answer_unit;
  }
  const ans = document.getElementById('sqAnswer');
  ans.textContent = answerText ? `Answer: ${answerText}` : '';
  const why = (q.why || '')
    .replace(/\u2028/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '');
  document.getElementById('sqExplanation').innerHTML = DOMPurify.sanitize(marked.parse(why || 'No explanation'));
  ans.style.display = 'block';
  document.getElementById('sqExplanation').style.display = 'block';
}
