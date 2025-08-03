const banks = window.banks;
let questions = [], index = 0, selected = null, responses = [], reviewing = false;
let backSummaryBtn, homeTopBtn, timerEl;
let pdfZoom = 1, pdfPane, pdfFrame;

function startTimer() {
  const start = Date.now();
  function pad(num) {
    return num.toString().padStart(2, '0');
  }
  function update() {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    timerEl.textContent = `${pad(mins)}:${pad(secs)}`;
  }
  update();
  setInterval(update, 1000);
}

function loadQuestions() {
  console.log('window.banks:', window.banks);
  console.log('URLSearchParams:', URLSearchParams);
  const params = new URLSearchParams(window.location.search);
  const bank = params.get('bank');
  if (!bank || !(bank in banks)) {
    alert('Invalid question bank.');
    window.location.href = 'index.html';
    return false;
  }
  let num = parseInt(params.get('num') || '10', 10);
  const files = banks[bank] || [];
  let all = [];
  for (const arr of files) {
    all = all.concat(arr);
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  questions = all.slice(0, num);
  console.log(all.slice(0, num));
  responses = Array(questions.length).fill(null);
  if (!questions.length) {
    const main = document.querySelector('.main');
    if (main) {
      main.innerHTML = '<p>No questions available for this bank.</p>';
    }
  }
  return true;
}

function initNav() {
  const nav = document.querySelector('.nav');
  nav.textContent = '';
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  questions.forEach((q, i) => {
    const li = document.createElement('li');
    li.innerHTML = `${i + 1}<button class="flag-btn" title="Flag">\u2691</button>`;
    if (i === 0) li.classList.add('active');
    if (data[q.id] && data[q.id].saved) li.classList.add('flagged');
    const flag = li.querySelector('.flag-btn');
    flag.onclick = (e) => {
      e.stopPropagation();
      const saved = toggleFlag(q.id);
      li.classList.toggle('flagged', saved);
    };
    li.onclick = () => {
      recordAnswer();
      index = i;
      renderQuestion();
    };
    nav.appendChild(li);
  });
}

function updateProgress() {
  const answered = responses.filter(r => r && r.answer !== null && r.answer !== '').length;
  const pct = (answered / questions.length) * 100;
  document.querySelector('.bar').style.width = pct + '%';
}

function updateNav() {
  const data = JSON.parse(localStorage.getItem('questionStats') || '{}');
  document.querySelectorAll('.nav li').forEach((li, i) => {
    const q = questions[i];
    li.classList.toggle('active', i === index);
    const flagged = data[q.id] && data[q.id].saved;
    if (flagged) {
      li.classList.add('flagged');
    } else {
      li.classList.remove('flagged');
    }
  });
}



function openPdf(url) {
  pdfFrame.src = url;
  pdfZoom = 1;
  pdfFrame.style.transform = 'scale(1)';
  pdfPane.style.display = 'flex';
}

function closePdf() {
  pdfPane.style.display = 'none';
  pdfFrame.src = '';
}

function convertPdfLinks(el) {
  if (!el) return;
  el.querySelectorAll('a[href$=".pdf"]').forEach(a => {
    const btn = document.createElement('button');
    btn.textContent = 'Open PDF';
    btn.className = 'pdf-btn';
    btn.onclick = (e) => { e.preventDefault(); openPdf(a.href); };
    a.replaceWith(btn);
  });
}

function renderQuestion() {
  const q = questions[index];
  selected = null;
  closePdf();
  document.querySelector('.q-number').textContent = `Question ${index + 1}`;
  const result = questionRenderer.renderQuestion(q, {
    text: '#qText',
    title: '#qTitle',
    options: '#answerOptions',
    input: '#calcInput',
    unit: '#answerUnit',
    feedback: '#feedback',
    answer: '#answer',
    explanation: '#explanation',
    showInput: true
  });
  convertPdfLinks(document.getElementById('qText'));
  convertPdfLinks(document.getElementById('qTitle'));
  const opts = document.getElementById('answerOptions');
  const calc = document.querySelector('.calculator');
  const input = document.getElementById('calcInput');
  const details = document.querySelector('.details');
  const corr = document.getElementById('answer');
  const expl = document.getElementById('explanation');
  if (q.answers && q.answers.length) {
    calc.style.display = 'none';
    result.buttons.forEach(btn => {
      btn.onclick = () => {
        if (reviewing) return;
        opts.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selected = btn.dataset.num;
      };
      if (responses[index] && responses[index].answer == btn.dataset.num) {
        btn.classList.add('selected');
        selected = btn.dataset.num;
      }
      if (reviewing) {
        btn.disabled = true;
        if (btn.dataset.num == q.correct_answer_number) {
          btn.classList.add('correct');
        }
      }
    });
  } else {
    calc.style.display = 'block';
    input.value = responses[index] ? (responses[index].answer || '') : '';
    input.disabled = reviewing;
  }
  if (reviewing) {
    const fb = document.getElementById('feedback');
    if (responses[index]) {
      fb.textContent = responses[index].correct ? 'Correct!' : 'Incorrect';
      fb.className = responses[index].correct ? 'correct' : 'incorrect';
    } else {
      fb.textContent = 'Not answered';
      fb.className = '';
    }
    questionRenderer.revealAnswer(q, { answer: corr, explanation: expl, prefix: 'Correct answer' });
    convertPdfLinks(expl);
    details.style.display = 'block';
  } else {
    const fb = document.getElementById('feedback');
    fb.textContent = '';
    fb.className = '';
    details.style.display = 'none';
  }
  updateProgress();
  updateNav();
}

function recordAnswer() {
  const q = questions[index];
  const input = document.getElementById('calcInput');
  let userAns = null;
  let userText = '';
  if (q.answers && q.answers.length) {
    userAns = selected;
    const obj = q.answers.find(a => a.answer_number == selected);
    userText = obj ? obj.text : '';
  } else {
    userAns = input.value.trim();
    userText = userAns ? userAns + (q.answer_unit ? ` ${q.answer_unit}` : '') : '';
  }
  let correctText = '';
  if (q.answers && q.answers.length) {
    const obj = q.answers.find(a => a.answer_number == q.correct_answer_number);
    correctText = obj ? obj.text : '';
  } else {
    correctText = (q.correct_answer || '') + (q.answer_unit ? ` ${q.answer_unit}` : '');
  }
  const correct = q.answers && q.answers.length ? (selected == q.correct_answer_number) : (userAns === (q.correct_answer || ''));
  responses[index] = { answer: userAns, text: userText, correctAnswer: correctText, correct };
  updateProgress();
}

function showSummary() {
  recordAnswer();
  reviewing = false;
  closePdf();
  backSummaryBtn.style.display = 'none';
  homeTopBtn.style.display = 'none';
  document.querySelector('.main').style.display = 'none';
  document.querySelector('.footer').style.display = 'none';
  const summary = document.querySelector('.summary');
  const tbody = summary.querySelector('tbody');
  const score = summary.querySelector('.score');
  tbody.textContent = '';
  let correctCount = 0;
  responses.forEach((r, i) => {
    const tr = document.createElement('tr');
    const ua = r ? r.text || '' : '';
    const ca = r ? r.correctAnswer || '' : '';
    const correct = r ? r.correct : false;
    if (correct) correctCount++;
    const icon = correct ? '✔' : '✘';

    const numTd = document.createElement('td');
    numTd.textContent = i + 1;

    const uaTd = document.createElement('td');
    uaTd.innerHTML = questionRenderer.sanitize(ua, true);

    const caTd = document.createElement('td');
    caTd.innerHTML = questionRenderer.sanitize(ca, true);

    const resultTd = document.createElement('td');
    resultTd.className = `result-icon ${correct ? 'correct' : 'incorrect'}`;
    resultTd.textContent = icon;

    const reviewTd = document.createElement('td');
    const reviewBtn = document.createElement('button');
    reviewBtn.dataset.idx = i;
    reviewBtn.textContent = 'Review';
    reviewTd.appendChild(reviewBtn);

    tr.appendChild(numTd);
    tr.appendChild(uaTd);
    tr.appendChild(caTd);
    tr.appendChild(resultTd);
    tr.appendChild(reviewTd);
    tbody.appendChild(tr);
  });
  score.textContent = `You answered ${correctCount} of ${questions.length} correctly.`;
  summary.style.display = 'block';
  document.querySelector('.finish-btn').style.display = 'none';
  summary.querySelectorAll('button[data-idx]').forEach(btn => {
    btn.onclick = () => {
      index = parseInt(btn.getAttribute('data-idx'), 10);
      reviewing = true;
      backSummaryBtn.style.display = 'inline-block';
      homeTopBtn.style.display = 'inline-block';
      summary.style.display = 'none';
      document.querySelector('.main').style.display = 'flex';
      document.querySelector('.footer').style.display = 'flex';
      renderQuestion();
    };
  });
}

document.addEventListener('DOMContentLoaded', () => {
  backSummaryBtn = document.querySelector('.summary-btn');
  homeTopBtn = document.querySelector('.home-top-btn');
  timerEl = document.querySelector('.timer');
  pdfPane = document.getElementById('pdfPane');
  pdfFrame = document.getElementById('pdfFrame');

  if (!backSummaryBtn || !homeTopBtn || !timerEl || !pdfPane || !pdfFrame) {
    return;
  }

  backSummaryBtn.style.display = 'none';
  homeTopBtn.style.display = 'none';

  document.querySelector('.pdf-close')?.addEventListener('click', closePdf);
  document.querySelector('.pdf-zoom-in')?.addEventListener('click', () => {
    pdfZoom += 0.1;
    pdfFrame.style.transform = `scale(${pdfZoom})`;
  });
  document.querySelector('.pdf-zoom-out')?.addEventListener('click', () => {
    pdfZoom = Math.max(0.1, pdfZoom - 0.1);
    pdfFrame.style.transform = `scale(${pdfZoom})`;
  });

  document.querySelector('.next-btn')?.addEventListener('click', () => {
    recordAnswer();
    if (index < questions.length - 1) { index++; renderQuestion(); }
  });
  document.querySelector('.back-btn')?.addEventListener('click', () => {
    recordAnswer();
    if (index > 0) { index--; renderQuestion(); }
  });
  document.querySelector('.flag-current-btn')?.addEventListener('click', () => {
    const li = document.querySelectorAll('.nav li')[index];
    const saved = toggleFlag(questions[index].id);
    li.classList.toggle('flagged', saved);
  });
  document.querySelector('.check-btn')?.addEventListener('click', () => {
    const q = questions[index];
    const opts = document.getElementById('answerOptions');
    const input = document.getElementById('calcInput');
    const fb = document.getElementById('feedback');
    const value = q.answers && q.answers.length ? selected : input.value.trim();
    questionRenderer.evaluateAnswer(q, value, { options: opts, feedback: fb });
    recordAnswer();
  });
  document.querySelector('.finish-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to finish the test?')) {
      showSummary();
    }
  });

  backSummaryBtn.addEventListener('click', showSummary);
  homeTopBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  startTimer();
  const loaded = loadQuestions();
  if (!loaded || !questions.length) return;
  initNav();
  renderQuestion();
});



