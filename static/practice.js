let questions = [];
let currentIndex = 0;
let answers = {};

async function loadQuestions() {
  try {
    const dataEl = document.getElementById('questionData');
    if (dataEl) {
      questions = JSON.parse(dataEl.textContent);
    } else {
      const resp = await fetch('/static/sample_questions.json');
      questions = await resp.json();
    }
  } catch (err) {
    console.error('Failed to load questions', err);
    questions = [];
  }
}

function loadStoredAnswers() {
  try {
    answers = JSON.parse(localStorage.getItem('practiceAnswers')) || {};
  } catch {
    answers = {};
  }
}

function saveAnswer() {
  const q = questions[currentIndex];
  if (!q) return;
  const input = document.querySelector('.calculator input');
  answers[q.id] = input.value;
  localStorage.setItem('practiceAnswers', JSON.stringify(answers));
}

function updateProgress() {
  const percent = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  document.querySelector('.progress .bar').style.width = percent + '%';
  const navItems = document.querySelectorAll('.nav li');
  navItems.forEach(li => li.classList.remove('active'));
  if (navItems[currentIndex]) navItems[currentIndex].classList.add('active');
}

function renderNav() {
  const nav = document.querySelector('.nav');
  nav.innerHTML = '';
  questions.forEach((q, idx) => {
    const li = document.createElement('li');
    li.textContent = idx + 1;
    if (idx === currentIndex) li.classList.add('active');
    li.addEventListener('click', () => {
      saveAnswer();
      currentIndex = idx;
      renderQuestion();
    });
    nav.appendChild(li);
  });
}

function renderQuestion() {
  const q = questions[currentIndex];
  if (!q) return;
  document.querySelector('.scenario').textContent = q.text || '';
  const prompt = document.querySelector('.prompt strong');
  if (prompt) prompt.textContent = q.title || '';
  const input = document.querySelector('.calculator input');
  input.value = answers[q.id] || '';
  const unit = document.querySelector('.calculator .unit');
  unit.textContent = q.answer_unit || '';
  updateProgress();
}

async function start() {
  loadStoredAnswers();
  await loadQuestions();
  if (!questions.length) return;
  renderNav();
  renderQuestion();
  document.querySelector('.back-btn').addEventListener('click', () => {
    saveAnswer();
    if (currentIndex > 0) {
      currentIndex--;
      renderQuestion();
    }
  });
  document.querySelector('.next-btn').addEventListener('click', () => {
    saveAnswer();
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion();
    }
  });
}

document.addEventListener('DOMContentLoaded', start);
