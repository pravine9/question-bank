import type { Question, QuestionBank, PracticeState } from '../src/types/question';
import { PracticeTimer, TimerExpiryModal } from './timer';

interface BankLabels {
  [key: string]: string;
}

interface BankData {
  bank: string;
  files: Question[][];
}

interface Response {
  answer: string | null;
  timestamp: number;
  isCorrect?: boolean;
}

interface SummaryData {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  notAnswered: number;
  score: number;
  timeElapsed: number;
  flaggedCount: number;
}

const bankLabels: BankLabels = {
  calculations: 'Calculations',
  clinical_mep: 'Clinical MEP',
  clinical_mixed: 'Clinical Mixed',
  clinical_otc: 'Clinical OTC',
  clinical_therapeutics: 'Clinical Therapeutics'
};

const banks: QuestionBank = window.banks;
let bank: string | null = null;
let questions: Question[] = [];
let index = 0;
let responses: Response[] = [];
let backSummaryBtn: HTMLButtonElement | null = null;
let homeTopBtn: HTMLButtonElement | null = null;
let startTime: number = 0;
let practiceTimer: PracticeTimer | null = null;
const flagged = new Set<number>();
let finished = false;
let summaryData: SummaryData | null = null;

const STORAGE_KEY = 'practice_state';
let persistState = true;

function saveState(): void {
  try {
    if (!persistState || !questions.length) return;
    

    
    const data: PracticeState = {
      bank: bank || '',
      questions,
      currentIndex: index,
      answers: responses.reduce((acc, r, i) => {
        if (r.answer !== null) acc[i] = r.answer;
        return acc;
      }, {} as Record<number, string>),
      flagged,
      startTime,
      isFinished: finished
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

function loadState(): PracticeState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load state', e);
    return null;
  }
}

function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear state', e);
  }
}

function getNotAnsweredCount(): number {
  return responses.filter(r => !r || r.answer === null || r.answer === '').length;
}

function toggleFlag(id: number): boolean {
  if (flagged.has(id)) {
    flagged.delete(id);
    saveState();
    return false;
  }
  flagged.add(id);
  saveState();
  return true;
}

function startTimer(savedStart?: number): void {
  startTime = savedStart || Date.now();
  
  // Initialize countdown timer
  practiceTimer = new PracticeTimer(
    questions.length,
    handleTimerExpiry,
    handleTimerWarning
  );
  
  practiceTimer.start(savedStart);
}

function handleTimerExpiry(): void {
  // Auto-finish test when timer expires
  recordAnswer();
  const modal = new TimerExpiryModal(() => {
    showSummary();
  });
  modal.show();
}

function handleTimerWarning(): void {
  // Handle timer warnings
  console.log('Timer warning triggered');
}

function getSelectedBank(id: string): BankData | null {
  const sel = document.getElementById(id) as HTMLSelectElement | null;
  if (!sel) return null;
  
  const bankName = sel.value;
  if (!bankName) return null;
  
  const files = banks[bankName];
  if (!Array.isArray(files) || !files.length) return null;
  
  return { bank: bankName, files };
}

function startPractice(): void {
  const data = getSelectedBank('bankSelect');
  if (!data) {
    alert('Please select a question bank');
    return;
  }
  
  bank = data.bank;
  
  // Flatten all questions from all files
  questions = data.files.flat();
  
  if (!questions.length) {
    alert('No questions found in selected bank');
    return;
  }
  
  // Shuffle questions
  questions = questions.sort(() => Math.random() - 0.5);
  
  // Initialize responses array
  responses = new Array(questions.length).fill(null).map(() => ({
    answer: null,
    timestamp: 0
  }));
  
  index = 0;
  finished = false;
  flagged.clear();
  summaryData = null;
  
  // Start timer
  startTimer();
  
  // Show first question
  showQuestion();
  
  // Update UI
  updateProgress();
  updateNavigation();
  
  // Save initial state
  saveState();
}

function showQuestion(): void {
  if (index >= questions.length) return;
  
  const question = questions[index];
  if (!question) return;
  
  // Reset UI
  resetQuestionUI();
  
  // Render question
  if (window.questionRenderer) {
    window.questionRenderer.renderQuestion(question, {
      title: '#questionTitle',
      text: '#questionText',
      img: '#questionImage',
      options: '#questionOptions',
      input: '#questionInput',
      unit: '#questionUnit',
      feedback: '#questionFeedback',
      answer: '#questionAnswer',
      explanation: '#questionExplanation'
    });
  }
  
  // Restore previous answer if exists
  const response = responses[index];
  if (response && response.answer) {
    restoreAnswer(response.answer);
  }
  
  // Update question counter
  updateQuestionCounter();
  
  // Update flag button
  updateFlagButton();
}

function resetQuestionUI(): void {
  const feedbackEl = document.getElementById('questionFeedback');
  const answerEl = document.getElementById('questionAnswer');
  const explanationEl = document.getElementById('questionExplanation');
  
  if (feedbackEl) {
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('correct', 'incorrect');
    feedbackEl.style.display = 'none';
  }
  
  if (answerEl) {
    answerEl.style.display = 'none';
  }
  
  if (explanationEl) {
    explanationEl.style.display = 'none';
  }
  
  // Re-enable inputs
  const optionsEl = document.getElementById('questionOptions');
  if (optionsEl) {
    optionsEl.querySelectorAll('input[type="radio"]').forEach((radio) => {
      (radio as HTMLInputElement).disabled = false;
    });
  }
  
  const inputEl = document.getElementById('questionInput');
  if (inputEl) {
    const input = inputEl.querySelector('input') as HTMLInputElement;
    if (input) {
      input.disabled = false;
      input.value = '';
    }
  }
}

function restoreAnswer(answer: string): void {
  // Restore radio button selection
  const optionsEl = document.getElementById('questionOptions');
  if (optionsEl) {
    const radio = optionsEl.querySelector(`input[value="${answer}"]`) as HTMLInputElement;
    if (radio) {
      radio.checked = true;
    }
  }
  
  // Restore text input
  const inputEl = document.getElementById('questionInput');
  if (inputEl) {
    const input = inputEl.querySelector('input') as HTMLInputElement;
    if (input) {
      input.value = answer;
    }
  }
}

function recordAnswer(): void {
  if (index >= questions.length) return;
  
  const question = questions[index];
  if (!question) return;
  
  let userAnswer = '';
  
  // Get answer from radio buttons
  const optionsEl = document.getElementById('questionOptions');
  if (optionsEl) {
    const selectedRadio = optionsEl.querySelector('input[type="radio"]:checked') as HTMLInputElement;
    if (selectedRadio) {
      userAnswer = selectedRadio.value;
    }
  }
  
  // Get answer from text input
  const inputEl = document.getElementById('questionInput');
  if (inputEl && !userAnswer) {
    const input = inputEl.querySelector('input') as HTMLInputElement;
    if (input) {
      userAnswer = input.value.trim();
    }
  }
  
  // Record response
  responses[index] = {
    answer: userAnswer || null,
    timestamp: Date.now(),
    isCorrect: userAnswer === question.correct_answer
  };
  
  // Show feedback
  showFeedback(question, userAnswer);
  
  // Save state
  saveState();
}

function showFeedback(question: Question, userAnswer: string): void {
  const feedbackEl = document.getElementById('questionFeedback');
  const answerEl = document.getElementById('questionAnswer');
  const explanationEl = document.getElementById('questionExplanation');
  
  if (!feedbackEl) return;
  
  const isCorrect = userAnswer === question.correct_answer;
  
  feedbackEl.textContent = isCorrect ? 'Correct!' : 'Incorrect';
  feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
  feedbackEl.style.display = '';
  
  if (answerEl) {
    answerEl.textContent = `Correct Answer: ${question.correct_answer}`;
    answerEl.style.display = '';
  }
  
  if (explanationEl && question.why) {
    explanationEl.innerHTML = question.why;
    explanationEl.style.display = '';
  }
  
  // Disable inputs
  const optionsEl = document.getElementById('questionOptions');
  if (optionsEl) {
    optionsEl.querySelectorAll('input[type="radio"]').forEach((radio) => {
      (radio as HTMLInputElement).disabled = true;
    });
  }
  
  const inputEl = document.getElementById('questionInput');
  if (inputEl) {
    const input = inputEl.querySelector('input') as HTMLInputElement;
    if (input) {
      input.disabled = true;
    }
  }
}

function nextQuestion(): void {
  if (index < questions.length - 1) {
    index++;
    showQuestion();
    updateProgress();
    updateNavigation();
  } else {
    // Last question - show finish button
    showFinishButton();
  }
}

function previousQuestion(): void {
  if (index > 0) {
    index--;
    showQuestion();
    updateProgress();
    updateNavigation();
  }
}

function showFinishButton(): void {
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.textContent = 'Finish Test';
    nextBtn.onclick = finishTest;
  }
}

function finishTest(): void {
  if (practiceTimer) {
    practiceTimer.stop();
  }
  
  finished = true;
  calculateSummary();
  showSummary();
  clearState();
}

function calculateSummary(): void {
  const totalQuestions = questions.length;
  const correctAnswers = responses.filter(r => r.isCorrect).length;
  const wrongAnswers = responses.filter(r => r && r.answer && !r.isCorrect).length;
  const notAnswered = getNotAnsweredCount();
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const timeElapsed = practiceTimer ? practiceTimer.getElapsedTime() : 0;
  const flaggedCount = flagged.size;
  
  summaryData = {
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    notAnswered,
    score,
    timeElapsed,
    flaggedCount
  };
}

function showSummary(): void {
  if (!summaryData) return;
  
  const summaryEl = document.getElementById('summary');
  if (!summaryEl) return;
  
  summaryEl.innerHTML = `
    <h2>Test Results</h2>
    <div class="summary-stats">
      <div class="stat">
        <span class="label">Score:</span>
        <span class="value ${summaryData.score >= 70 ? 'pass' : 'fail'}">${summaryData.score}%</span>
      </div>
      <div class="stat">
        <span class="label">Correct:</span>
        <span class="value">${summaryData.correctAnswers}/${summaryData.totalQuestions}</span>
      </div>
      <div class="stat">
        <span class="label">Time:</span>
        <span class="value">${Math.floor(summaryData.timeElapsed / 60)}:${(summaryData.timeElapsed % 60).toString().padStart(2, '0')}</span>
      </div>
      <div class="stat">
        <span class="label">Flagged:</span>
        <span class="value">${summaryData.flaggedCount}</span>
      </div>
    </div>
    <div class="summary-actions">
      <button class="btn btn-primary" onclick="location.reload()">Take Another Test</button>
      <button class="btn btn-secondary" onclick="window.location.href='index.html'">Back to Home</button>
    </div>
  `;
  
  summaryEl.style.display = 'block';
  
  // Hide question area
      const questionArea = document.querySelector('.question-area');
    if (questionArea) {
      (questionArea as HTMLElement).style.display = 'none';
    }
    
    // Hide navigation
    const navigation = document.querySelector('.navigation');
    if (navigation) {
      (navigation as HTMLElement).style.display = 'none';
    }
}

function updateProgress(): void {
  const progressEl = document.getElementById('progress');
  if (progressEl) {
    const percentage = ((index + 1) / questions.length) * 100;
    progressEl.style.width = `${percentage}%`;
    progressEl.textContent = `${index + 1} / ${questions.length}`;
  }
}

function updateNavigation(): void {
  const prevBtn = document.getElementById('prevBtn') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('nextBtn') as HTMLButtonElement | null;
  
  if (prevBtn) {
    prevBtn.disabled = index === 0;
  }
  
  if (nextBtn) {
    nextBtn.disabled = index === questions.length - 1;
  }
}

function updateQuestionCounter(): void {
  const counterEl = document.getElementById('questionCounter');
  if (counterEl) {
    counterEl.textContent = `Question ${index + 1} of ${questions.length}`;
  }
}

function updateFlagButton(): void {
  const flagBtn = document.getElementById('flagBtn');
  if (flagBtn) {
    const isFlagged = flagged.has(questions[index]?.id || 0);
    flagBtn.textContent = isFlagged ? '🚩 Unflag' : '🚩 Flag';
    flagBtn.className = isFlagged ? 'btn btn-warning' : 'btn btn-secondary';
  }
}

function flagQuestion(): void {
  if (index >= questions.length) return;
  
  const question = questions[index];
  if (!question) return;
  
  toggleFlag(question.id);
  updateFlagButton();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI elements
  backSummaryBtn = document.getElementById('backSummaryBtn') as HTMLButtonElement | null;
  homeTopBtn = document.getElementById('homeTopBtn') as HTMLButtonElement | null;
  
  // Set up event listeners
  if (backSummaryBtn) backSummaryBtn.addEventListener('click', () => window.history.back());
  if (homeTopBtn) homeTopBtn.addEventListener('click', () => window.location.href = 'index.html');
  
  // Set up question navigation
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const flagBtn = document.getElementById('flagBtn');
  
  if (prevBtn) prevBtn.addEventListener('click', previousQuestion);
  if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
  if (flagBtn) flagBtn.addEventListener('click', flagQuestion);
  
  // Set up answer submission
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.addEventListener('click', recordAnswer);
  
  // Load saved state if exists
  const savedState = loadState();
  if (savedState && savedState.bank && savedState.questions.length > 0) {
    // Restore practice session
    bank = savedState.bank;
    questions = savedState.questions;
    index = savedState.currentIndex;
    responses = questions.map((_, i) => ({
      answer: savedState.answers[i] || null,
      timestamp: Date.now(),
      isCorrect: savedState.answers[i] === questions[i]?.correct_answer
    }));
    flagged.clear();
    savedState.flagged.forEach(id => flagged.add(id));
    startTime = savedState.startTime;
    finished = savedState.isFinished;
    
    if (!finished) {
      startTimer(startTime);
      showQuestion();
      updateProgress();
      updateNavigation();
    } else {
      calculateSummary();
      showSummary();
    }
  } else {
    // New practice session - populate bank selector
    populateBankSelects();
  }
});

function populateBankSelects(): void {
  const bankSelect = document.getElementById('bankSelect') as HTMLSelectElement | null;
  if (!bankSelect) return;
  
  const names = Object.keys(banks)
    .filter(k => Array.isArray(banks[k]))
    .sort();
    
  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = bankLabels[name] || name;
    bankSelect.appendChild(opt);
  });
  
  // Preselect last used bank
  try {
    const last = localStorage.getItem('lastBank');
    if (last && banks[last]) {
      bankSelect.value = last;
    }
  } catch (e) {
    console.warn('Failed to load lastBank', e);
  }
}

// Export functions for potential use in other modules
export {
  startPractice,
  showQuestion,
  nextQuestion,
  previousQuestion,
  recordAnswer,
  finishTest,
  toggleFlag,
  getNotAnsweredCount
};
