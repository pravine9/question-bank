const bankLabels = {
  calculations: 'Calculations',
  clinical_mep: 'Clinical MEP',
  clinical_mixed: 'Clinical Mixed',
  clinical_otc: 'Clinical OTC',
  clinical_therapeutics: 'Clinical Therapeutics'
};
const banks = window.banks;
let bank;
let questions = [], index = 0, selected = null, responses = [], reviewing = false;
let backSummaryBtn, homeTopBtn, timerEl;
let timerId, startTime;
const flagged = new Set();
let finished = false;
let summaryData = null;
let statsRecorded = false;

const STORAGE_KEY = 'practice_state';
let persistState = true;

function saveState() {
  try {
    if (!persistState || !questions.length) return;
    const data = {
      bank,
      questions,
      index,
      responses,
      flagged: Array.from(flagged),
      startTime,
      finished,
      summary: summaryData,
      statsRecorded
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load state', e);
    return null;
  }
}

function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear state', e);
  }
}

function toggleFlag(id) {
  if (flagged.has(id)) {
    flagged.delete(id);
    saveState();
    return false;
  }
  flagged.add(id);
  saveState();
  return true;
}

function startTimer(savedStart) {
  startTime = savedStart || Date.now();
  function pad(num) {
    return num.toString().padStart(2, '0');
  }
  function update() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    timerEl.textContent = `${pad(mins)}:${pad(secs)}`;
  }
  update();
  timerId = setInterval(update, 1000);
}

function computeCorrectText(q) {
  if (q.answers && q.answers.length) {
    const obj = q.answers.find(a => a.answer_number == q.correct_answer_number);
    return obj ? obj.text : '';
  }
  return (q.correct_answer || '') + (q.answer_unit ? ` ${q.answer_unit}` : '');
}

function loadQuestions() {
  console.log('window.banks:', window.banks);
  console.log('URLSearchParams:', URLSearchParams);
  const params = new URLSearchParams(window.location.search);
  bank = params.get('bank');
  const titleEl = document.querySelector('.test-title');
  if (titleEl) {
    titleEl.textContent = bankLabels[bank] || bank;
  }
  if (!bank || !(bank in banks)) {
    alert('Invalid question bank.');
    window.location.href = 'index.html';
    return false;
  }
  let num = parseInt(params.get('num') || '10', 10);
  const files = banks[bank] || [];
  if (files.length === 0) {
    console.warn(`No files found for bank: ${bank}`);
    const main = document.querySelector('.main');
    if (main) {
      main.innerHTML = '<p>No questions available for this bank.</p>';
    }
    return false;
  }
  let all = [];
  for (const arr of files) {
    all = all.concat(arr);
  }
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  questions = all.slice(0, num);
  console.log(questions);
  responses = questions.map(q => ({
    answer: null,
    text: '',
    correctAnswer: computeCorrectText(q),
    correct: false
  }));
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
  questions.forEach((q, i) => {
    const li = document.createElement('li');
    li.innerHTML = `${i + 1}<button class="flag-btn" title="Flag">\u2691</button>`;
    if (i === 0) li.classList.add('active');
    if (flagged.has(q.id)) li.classList.add('flagged');
    const flag = li.querySelector('.flag-btn');
    flag.onclick = (e) => {
      e.stopPropagation();
      const saved = toggleFlag(q.id);
      li.classList.toggle('flagged', saved);
    };
    li.onclick = () => {
      recordAnswer();
      index = i;
      saveState();
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
  document.querySelectorAll('.nav li').forEach((li, i) => {
    const q = questions[i];
    const isActive = i === index;
    li.classList.toggle('active', isActive);
    if (isActive) {
      li.scrollIntoView({ block: 'nearest' });
    }
    if (flagged.has(q.id)) {
      li.classList.add('flagged');
    } else {
      li.classList.remove('flagged');
    }
  });
}



function renderQuestion() {
  const q = questions[index];
  selected = null;
  questionRenderer.closePdf();
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
  questionRenderer.convertPdfLinks(document.getElementById('qText'));
  questionRenderer.convertPdfLinks(document.getElementById('qTitle'));
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
    questionRenderer.convertPdfLinks(expl);
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
  const correct = q.answers && q.answers.length ? (selected == q.correct_answer_number) : (userAns === (q.correct_answer || ''));
  const r = responses[index];
  r.answer = userAns;
  r.text = userText;
  r.correct = correct;
  updateProgress();
  saveState();
}

function showSummary() {
  clearInterval(timerId);
  reviewing = false;
  finished = true;
  questionRenderer.closePdf();
  backSummaryBtn.style.display = 'none';
  homeTopBtn.style.display = 'inline-block';
  document.querySelector('.main').style.display = 'none';
  document.querySelector('.footer').style.display = 'none';
  const summaryEl = document.querySelector('.summary');
  const tbody = summaryEl.querySelector('tbody');
  const score = summaryEl.querySelector('.score');
  const timeEl = summaryEl.querySelector('.time-taken');
  const elapsed = summaryData?.elapsed || Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const pad = num => num.toString().padStart(2, '0');
  if (timeEl) {
    timeEl.textContent = `Time taken: ${pad(mins)}:${pad(secs)}`;
  }
  if (!statsRecorded) {
    questions.forEach((q, i) => {
      const r = responses[i];
      questionRenderer.updateStats(q.id, r.correct);
    });
    statsRecorded = true;
  }
  tbody.textContent = '';
  let correctCount = 0;
  responses.forEach((r, i) => {
    const tr = document.createElement('tr');
    const ua = r.text || '';
    const ca = r.correctAnswer || '';
    const correct = r.correct;
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
    reviewBtn.classList.add('review-btn');
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
  summaryData = { elapsed, correctCount };
  score.textContent = `You answered ${correctCount} of ${questions.length} correctly (${Math.round(correctCount / questions.length * 100)}%).`;
  summaryEl.style.display = 'block';
  document.querySelector('.finish-btn').style.display = 'none';
  summaryEl.querySelectorAll('button[data-idx]').forEach(btn => {
    btn.onclick = () => {
      index = parseInt(btn.getAttribute('data-idx'), 10);
      saveState();
      reviewing = true;
      backSummaryBtn.style.display = 'inline-block';
      homeTopBtn.style.display = 'inline-block';
      summaryEl.style.display = 'none';
      document.querySelector('.main').style.display = 'flex';
      document.querySelector('.footer').style.display = 'flex';
      renderQuestion();
    };
  });
  flagged.clear();
  saveState();

  // Save practice result to history
  savePracticeResult();
}

// Function to save practice test result
function savePracticeResult() {
  try {
    const resultId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correctCount = summaryData?.correctCount || 0;
    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const duration = Math.floor((Date.now() - startTime) / 1000 / 60); // in minutes
    const flaggedCount = Array.from(flagged).length;

    const practiceResult = {
      id: resultId,
      bank: bank,
      totalQuestions: totalQuestions,
      correctAnswers: correctCount,
      score: score,
      startTime: startTime,
      endTime: Date.now(),
      duration: duration,
      date: new Date().toISOString(),
      flaggedQuestions: flaggedCount,
      questions: questions.map((q, index) => {
        const response = responses[index] || {};
        return {
          id: q.id,
          userAnswer: response.text || '',
          correctAnswer: response.correctAnswer || '',
          isCorrect: response.correct || false,
          flagged: flagged.has(q.id)
        };
      })
    };

    // Get existing history
    const existingHistory = localStorage.getItem('practice_history');
    let history = existingHistory ? JSON.parse(existingHistory) : { results: [] };
    
    // Add new result to beginning of array
    history.results.unshift(practiceResult);
    
    // Keep only last 50 results to prevent storage bloat
    if (history.results.length > 50) {
      history.results = history.results.slice(0, 50);
    }

    // Calculate updated stats
    const totalTests = history.results.length;
    const totalScore = history.results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = totalTests > 0 ? Math.round((totalScore / totalTests) * 100) / 100 : 0;
    const bestScore = history.results.length > 0 ? Math.max(...history.results.map(r => r.score)) : 0;
    const totalTime = history.results.reduce((sum, result) => sum + result.duration, 0);

    const updatedHistory = {
      results: history.results,
      totalTests,
      averageScore,
      bestScore,
      totalTime
    };

    // Save to localStorage
    localStorage.setItem('practice_history', JSON.stringify(updatedHistory));
    
    console.log('✅ Practice result saved to history:', practiceResult);
  } catch (error) {
    console.warn('Failed to save practice result:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  backSummaryBtn = document.querySelector('.summary-btn');
  homeTopBtn = document.querySelector('.home-top-btn');
  timerEl = document.querySelector('.timer');
  questionRenderer.initPdfViewer();

  if (!backSummaryBtn || !homeTopBtn || !timerEl) {
    return;
  }

  backSummaryBtn.style.display = 'none';
  homeTopBtn.style.display = 'none';

  document.querySelector('.next-btn')?.addEventListener('click', () => {
    recordAnswer();
    if (index < questions.length - 1) {
      index++;
      saveState();
      renderQuestion();
      history.replaceState(null, '', window.location.href);
    }
  });
  document.querySelector('.back-btn')?.addEventListener('click', () => {
    recordAnswer();
    if (index > 0) {
      index--;
      saveState();
      renderQuestion();
      history.replaceState(null, '', window.location.href);
    }
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
      recordAnswer();
      showSummary();
    }
  });

  backSummaryBtn.addEventListener('click', showSummary);
  homeTopBtn.addEventListener('click', () => {
    clearState();
    persistState = false;
    window.removeEventListener('beforeunload', saveState);
    // Remember the bank so it can be preselected on the home page
    try {
      localStorage.setItem('lastBank', bank);
    } catch (e) {
      console.warn('Failed to store lastBank', e);
    }
    window.location.href = 'index.html';
  });
  const params = new URLSearchParams(window.location.search);
  const urlBank = params.get('bank');
  const state = loadState();
  if (state && state.bank === urlBank) {
    bank = state.bank;
    questions = state.questions || [];
    index = state.index || 0;
    responses = state.responses || [];
    flagged.clear();
    (state.flagged || []).forEach(id => flagged.add(id));
    finished = state.finished || false;
    summaryData = state.summary || null;
    statsRecorded = state.statsRecorded || false;
    const titleEl = document.querySelector('.test-title');
    if (titleEl) { titleEl.textContent = bankLabels[bank] || bank; }
    if (!questions.length) return;
    initNav();
    if (finished) {
      startTime = state.startTime;
      showSummary();
    } else {
      startTimer(state.startTime);
      renderQuestion();
    }
  } else {
    startTimer();
    const loaded = loadQuestions();
    if (!loaded || !questions.length) return;
    initNav();
    renderQuestion();
  }
  window.addEventListener('beforeunload', saveState);
});



