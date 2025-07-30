// JavaScript for the practice page
let questions = [];
let index = 0;

function loadQuestions() {
  const script = document.getElementById('questions-data');
  if (script) {
    try {
      questions = JSON.parse(script.textContent);
      return Promise.resolve();
    } catch (err) {
      console.error('Failed to parse embedded questions', err);
    }
  }
  const url = document.body.dataset.questionsUrl;
  if (url) {
    return fetch(url)
      .then((r) => r.json())
      .then((data) => {
        questions = data;
      });
  }
  return Promise.resolve();
}

function initNav() {
  const nav = document.querySelector('.nav');
  nav.innerHTML = '';
  questions.forEach((q, i) => {
    const li = document.createElement('li');
    li.textContent = i + 1;
    if (i === index) li.classList.add('active');
    li.onclick = () => {
      index = i;
      renderQuestion();
    };
    nav.appendChild(li);
  });
}

function updateProgress() {
  const pct = ((index + 1) / questions.length) * 100;
  document.querySelector('.bar').style.width = pct + '%';
}

function updateNav() {
  document.querySelectorAll('.nav li').forEach((li, i) => {
    li.classList.toggle('active', i === index);
  });
}

function recordAnswer(value) {
  const key = 'practiceAnswers';
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  const q = questions[index];
  if (q && q.id) {
    data[q.id] = value;
    localStorage.setItem(key, JSON.stringify(data));
  }
}

function getRecordedAnswer(idx) {
  const key = 'practiceAnswers';
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  const q = questions[idx];
  if (q && q.id && data[q.id] !== undefined) return data[q.id];
  return null;
}

function renderQuestion() {
  const q = questions[index];
  if (!q) return;
  document.querySelector('.scenario').textContent = q.text || q.title || '';
  const opts = document.querySelector('.options');
  const calc = document.querySelector('.calculator');
  const input = calc.querySelector('input');
  const unit = calc.querySelector('.unit');
  opts.innerHTML = '';
  if (q.answers && q.answers.length) {
    calc.style.display = 'none';
    q.answers.forEach((a) => {
      const btn = document.createElement('button');
      btn.textContent = a.text;
      btn.onclick = () => {
        opts.querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        recordAnswer(a.answer_number);
      };
      opts.appendChild(btn);
      // restore previously selected answer
      const saved = getRecordedAnswer(index);
      if (saved === a.answer_number) btn.classList.add('selected');
    });
  } else {
    calc.style.display = 'block';
    input.value = '';
    const saved = getRecordedAnswer(index);
    if (saved !== null) input.value = saved;
    input.oninput = () => recordAnswer(input.value);
    unit.textContent = q.answer_unit || '';
  }
  updateProgress();
  updateNav();
}

document.querySelector('.next-btn').onclick = () => {
  if (index < questions.length - 1) {
    index++;
    renderQuestion();
  }
};

document.querySelector('.back-btn').onclick = () => {
  if (index > 0) {
    index--;
    renderQuestion();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  loadQuestions().then(() => {
    if (!questions.length) return;
    initNav();
    renderQuestion();
  });
});
