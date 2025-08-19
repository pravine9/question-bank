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
let timerId, startTime, practiceTimer;
const flagged = new Set();
let finished = false;
let summaryData = null;
let statsRecorded = false;

const STORAGE_KEY = 'practice_state';
let persistState = true;

function saveState() {
  try {
    if (!persistState || !questions.length) return;
    
    // Save scroll position
    const questionArea = document.querySelector('.question-area');
    const scrollPosition = questionArea ? questionArea.scrollTop : 0;
    
    const data = {
      bank,
      questions,
      index,
      responses,
      flagged: Array.from(flagged),
      startTime,
      finished,
      summary: summaryData,
      statsRecorded,
      scrollPosition
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

function getNotAnsweredCount() {
  return responses.filter(r => !r || r.answer === null || r.answer === '').length;
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
  
  // Initialize countdown timer
  practiceTimer = new PracticeTimer(
    questions.length,
    handleTimerExpiry,
    handleTimerWarning
  );
  
  practiceTimer.start(savedStart);
}

function handleTimerExpiry() {
  // Auto-finish test when timer expires
  recordAnswer();
  const modal = new TimerExpiryModal(() => {
    showSummary();
  });
  modal.show();
}

function handleTimerWarning(warning) {
  TimerNotification.show(warning.message, warning.type, 4000);
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
  const progressBar = document.querySelector('.bar');
  const header = document.querySelector('.header');
  
  if (progressBar) {
    progressBar.style.width = pct + '%';
  }
  
  // Add percentage display under the progress bar
  let percentageDisplay = header.querySelector('.progress-percentage');
  if (!percentageDisplay) {
    percentageDisplay = document.createElement('div');
    percentageDisplay.className = 'progress-percentage';
    percentageDisplay.style.cssText = `
      text-align: center;
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      margin-top: 4px;
      padding-right: 10px;
    `;
    const progressContainer = header.querySelector('.progress');
    progressContainer.parentNode.insertBefore(percentageDisplay, progressContainer.nextSibling);
  }
  percentageDisplay.textContent = Math.round(pct) + '%';
}

function updateProgressOnAnswer() {
  recordAnswer();
  updateProgress();
}

function showReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (!modal) return;
  
  // Calculate counts
  const attempted = responses.filter(r => r && r.answer !== null && r.answer !== '').length;
  const notAttempted = questions.length - attempted;
  const flaggedQuestions = Array.from(flagged).length;
  
  // Update counts
  document.getElementById('attemptedCount').textContent = attempted;
  document.getElementById('notAttemptedCount').textContent = notAttempted;
  document.getElementById('flaggedCount').textContent = flaggedQuestions;
  
  // Generate question grid
  const gridContainer = document.getElementById('questionGridReview');
  gridContainer.innerHTML = '';
  
  questions.forEach((q, i) => {
    const gridItem = document.createElement('div');
    gridItem.className = 'grid-item';
    gridItem.textContent = i + 1;
    gridItem.dataset.index = i;
    
    const response = responses[i];
    const isAttempted = response && response.answer !== null && response.answer !== '';
    const isFlagged = flagged.has(q.id);
    const isCurrent = i === index;
    
    if (isAttempted) {
      gridItem.classList.add('attempted');
    } else {
      gridItem.classList.add('not-attempted');
    }
    
    if (isFlagged) {
      gridItem.classList.add('flagged');
    }
    
    if (isCurrent) {
      gridItem.classList.add('current');
    }
    
    gridItem.addEventListener('click', () => {
      index = i;
      closeReviewModal();
      renderQuestion();
      
      // Reset scroll position to top for new question
      const questionArea = document.querySelector('.question-area');
      if (questionArea) {
        questionArea.scrollTop = 0;
      }
      
      saveState();
    });
    
    gridContainer.appendChild(gridItem);
  });
  
  modal.style.display = 'flex';
}

function closeReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function updateNav() {
  document.querySelectorAll('.nav li').forEach((li, i) => {
    const q = questions[i];
    const isActive = i === index;
    const response = responses[i];
    const isAnswered = response && response.answer !== null && response.answer !== '';
    
    li.classList.toggle('active', isActive);
    li.classList.toggle('answered', isAnswered);
    
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
  const corr = document.getElementById('answer');
  const expl = document.getElementById('explanation');
  
  // Update flag button state
  const flagBtn = document.querySelector('.flag-current-btn');
  if (flagBtn) {
    if (flagged.has(q.id)) {
      flagBtn.classList.add('flagged');
      flagBtn.title = 'Remove Flag';
    } else {
      flagBtn.classList.remove('flagged');
      flagBtn.title = 'Flag for Review';
    }
  }
  
  if (q.answers && q.answers.length) {
    calc.style.display = 'none';
    result.buttons.forEach(btn => {
      btn.onclick = () => {
        if (reviewing) return;
        
        // Allow deselection by clicking the same button
        if (btn.classList.contains('selected')) {
          btn.classList.remove('selected');
          selected = null;
        } else {
          opts.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selected = btn.dataset.num;
        }
        updateProgressOnAnswer();
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
    
    // Add event listener for calculation input
    if (!reviewing) {
      input.addEventListener('input', () => {
        updateProgressOnAnswer();
      });
    }
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
    corr.style.display = 'block';
    expl.style.display = 'block';
  } else {
    const fb = document.getElementById('feedback');
    fb.textContent = '';
    fb.className = '';
    corr.style.display = 'none';
    expl.style.display = 'none';
  }
  updateProgress();
  updateNav();
  
  // Update navigation button states
  const backBtn = document.querySelector('.back-btn');
  const nextBtn = document.querySelector('.next-btn');
  
  if (backBtn) {
    backBtn.disabled = index === 0;
  }
  
  if (nextBtn) {
    nextBtn.disabled = index === questions.length - 1;
  }
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
  // Stop timer
  if (practiceTimer) {
    practiceTimer.stop();
  }
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
  
  // Get timer statistics
  const timerStats = practiceTimer ? practiceTimer.getStats() : null;
  const elapsed = summaryData?.elapsed || Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const pad = num => num.toString().padStart(2, '0');
  
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
  const notAnsweredCount = getNotAnsweredCount();
  const wrongCount = questions.length - correctCount - notAnsweredCount;
  
  summaryData = { 
    elapsed, 
    correctCount, 
    wrongCount,
    notAnsweredCount,
    timerStats 
  };
  
  // Update score display with enhanced statistics
  const scoreDisplay = document.getElementById('scoreDisplay');
  const percentageDisplay = document.getElementById('percentageDisplay');
  const percentage = Math.round((correctCount / questions.length) * 100);
  
  if (scoreDisplay) {
    scoreDisplay.textContent = `${correctCount}/${questions.length}`;
  }
  if (percentageDisplay) {
    percentageDisplay.textContent = `(${percentage}%)`;
  }
  
  // Add enhanced statistics display
  addEnhancedSummaryStats(timerStats, correctCount, wrongCount, notAnsweredCount);
  
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

function addEnhancedSummaryStats(timerStats, correctCount, wrongCount, notAnsweredCount) {
  // Find or create enhanced stats container
  let statsContainer = document.querySelector('.enhanced-summary-stats');
  if (!statsContainer) {
    statsContainer = document.createElement('div');
    statsContainer.className = 'enhanced-summary-stats';
    
    // Insert after score display
    const summaryEl = document.querySelector('.summary');
    const scoreContainer = summaryEl.querySelector('.summary-score');
    if (scoreContainer && scoreContainer.nextSibling) {
      summaryEl.insertBefore(statsContainer, scoreContainer.nextSibling);
    } else if (scoreContainer) {
      scoreContainer.parentNode.insertBefore(statsContainer, scoreContainer.nextSibling);
    }
  }
  
  // Build stats HTML
  let statsHTML = `
    <div class="stats-grid">
      <div class="stat-item correct">
        <div class="stat-value">${correctCount}</div>
        <div class="stat-label">Correct</div>
      </div>
      <div class="stat-item wrong">
        <div class="stat-value">${wrongCount}</div>
        <div class="stat-label">Wrong</div>
      </div>
      <div class="stat-item not-answered">
        <div class="stat-value">${notAnsweredCount}</div>
        <div class="stat-label">Not Answered</div>
      </div>
  `;
  
  if (timerStats) {
    const timeUsed = timerStats.formatTime ? timerStats.formatTime(timerStats.timeUsedSeconds) : 
                   `${Math.floor(timerStats.timeUsedSeconds / 60)}:${(timerStats.timeUsedSeconds % 60).toString().padStart(2, '0')}`;
    const timeAllocated = timerStats.formatTime ? timerStats.formatTime(timerStats.allocatedTimeSeconds) :
                         `${Math.floor(timerStats.allocatedTimeSeconds / 60)}:${(timerStats.allocatedTimeSeconds % 60).toString().padStart(2, '0')}`;
    
    statsHTML += `
      <div class="stat-item time-used">
        <div class="stat-value">${timeUsed}</div>
        <div class="stat-label">Time Used</div>
      </div>
      <div class="stat-item time-allocated">
        <div class="stat-value">${timeAllocated}</div>
        <div class="stat-label">Time Allocated</div>
      </div>
    `;
    
    if (timerStats.isFinishedEarly) {
      const timeSaved = timerStats.formatTime ? timerStats.formatTime(timerStats.timeSavedSeconds) :
                       `${Math.floor(timerStats.timeSavedSeconds / 60)}:${(timerStats.timeSavedSeconds % 60).toString().padStart(2, '0')}`;
      statsHTML += `
        <div class="stat-item time-saved">
          <div class="stat-value">${timeSaved}</div>
          <div class="stat-label">Time Saved</div>
        </div>
      `;
    }
  }
  
  statsHTML += `</div>`;
  statsContainer.innerHTML = statsHTML;
}

// Function to save practice test result
function savePracticeResult() {
  try {
    const resultId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const correctCount = summaryData?.correctCount || 0;
    const totalQuestions = questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const timerStats = practiceTimer ? practiceTimer.getStats() : null;
    const duration = Math.floor((Date.now() - startTime) / 1000 / 60); // in minutes
    const flaggedCount = Array.from(flagged).length;
    const notAnsweredCount = getNotAnsweredCount();
    const wrongCount = questions.length - correctCount - notAnsweredCount;

    const practiceResult = {
      id: resultId,
      bank: bank,
      totalQuestions: totalQuestions,
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      notAnswered: notAnsweredCount,
      score: score,
      startTime: startTime,
      endTime: Date.now(),
      duration: duration,
      date: new Date().toISOString(),
      flaggedQuestions: flaggedCount,
      timerStats: timerStats,
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

// Enhanced notification system
function showNotification(message, type = 'info', duration = 3000) {
  TimerNotification.show(message, type, duration);
}





function resetScrollPosition() {
  const questionArea = document.querySelector('.question-area');
  if (questionArea) {
    questionArea.scrollTop = 0;
  }
}

// Prevent accidental navigation
function setupNavigationProtection() {
  window.addEventListener('beforeunload', (e) => {
    if (!finished && questions.length > 0) {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
      return e.returnValue;
    }
  });
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
      
      // Reset scroll position to top for new question
      const questionArea = document.querySelector('.question-area');
      if (questionArea) {
        questionArea.scrollTop = 0;
      }
      
      history.replaceState(null, '', window.location.href);
    }
  });
  document.querySelector('.back-btn')?.addEventListener('click', () => {
    recordAnswer();
    if (index > 0) {
      index--;
      saveState();
      renderQuestion();
      
      // Reset scroll position to top for new question
      const questionArea = document.querySelector('.question-area');
      if (questionArea) {
        questionArea.scrollTop = 0;
      }
      
      history.replaceState(null, '', window.location.href);
    }
  });
  document.querySelector('.flag-current-btn')?.addEventListener('click', () => {
    const li = document.querySelectorAll('.nav li')[index];
    const saved = toggleFlag(questions[index].id);
    li.classList.toggle('flagged', saved);
    
    // Update flag button state in footer
    const flagBtn = document.querySelector('.flag-current-btn');
    if (flagBtn) {
      if (saved) {
        flagBtn.classList.add('flagged');
        flagBtn.title = 'Remove Flag';
      } else {
        flagBtn.classList.remove('flagged');
        flagBtn.title = 'Flag for Review';
      }
    }
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
      
      // Restore scroll position after rendering
      if (state.scrollPosition !== undefined) {
        setTimeout(() => {
          const questionArea = document.querySelector('.question-area');
          if (questionArea) {
            questionArea.scrollTop = state.scrollPosition;
          }
        }, 100);
      }
    }
  } else {
    startTimer();
    const loaded = loadQuestions();
    if (!loaded || !questions.length) return;
    initNav();
    renderQuestion();
  }
  // Review status button event listener
  document.querySelector('.review-status-btn')?.addEventListener('click', showReviewModal);
  document.querySelector('.review-modal .modal-close')?.addEventListener('click', closeReviewModal);
  document.querySelector('.review-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('review-modal')) {
      closeReviewModal();
    }
  });

  // Summary Go Home button event listener
  document.getElementById('goHome')?.addEventListener('click', () => {
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

  window.addEventListener('beforeunload', saveState);
  
  // Initialize enhancements
  // setupKeyboardShortcuts(); // Removed for simplified interface
  setupNavigationProtection();
});



