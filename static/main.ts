import type { Question, QuestionBank, BankData } from '@/types/question';
import { formatBankName } from '@/utils/bankNames';
import { evaluateAnswer, getCorrectAnswerText } from '@/utils/answers';
import { banks } from './banks';
import { questionRenderer } from './question_renderer';

const bankFiles: QuestionBank = banks;
let banksPopulated = false;

// Add event handlers for question buttons
let currentQuestion: Question | null = null;
let questionContainer: HTMLElement | null = null;
let selectedAnswer = '';

export function init(): void {
  const loadBtn = document.getElementById('loadBtn') as HTMLButtonElement | null;
  if (loadBtn) {
    loadBtn.addEventListener('click', loadQuestion);
  }

  const practiceBtn = document.getElementById('practiceBtn') as HTMLButtonElement | null;
  if (practiceBtn) {
    practiceBtn.addEventListener('click', startPractice);
  }

  const checkBtn = document.getElementById('checkBtn') as HTMLButtonElement | null;
  if (checkBtn) {
    checkBtn.addEventListener('click', checkAnswer);
  }

  const revealBtn = document.getElementById('revealBtn') as HTMLButtonElement | null;
  if (revealBtn) {
    revealBtn.addEventListener('click', revealAnswer);
  }

  const statsModal = document.getElementById('statsModal');
  if (statsModal) {
    statsModal.classList.remove('show');
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get('isStandAlone') === 'true') {
    document.body.classList.add('standalone');
    const container = document.querySelector('.container');
    if (container) {
      container.classList.add('standalone');
    }
  }

  questionContainer = document.getElementById('questionRoot');

  populateBankSelects(bankFiles);

  try {
    const last = localStorage.getItem('lastBank');
    if (last) {
      const bankSelect = document.getElementById('bankSelect') as HTMLSelectElement | null;
      if (bankSelect && bankFiles[last]) {
        bankSelect.value = last;
      }
    }
  } catch (e) {
    console.warn('Failed to load lastBank', e);
  }
}

function populateBankSelects(data: QuestionBank): void {
  // Prevent duplicate population
  if (banksPopulated) {
    return;
  }

  const bankSelect = document.getElementById(
    'bankSelect'
  ) as HTMLSelectElement | null;
  const statsSelect = document.getElementById(
    'statsBankSelect'
  ) as HTMLSelectElement | null;

  if (!bankSelect && !statsSelect) {
    console.warn('Bank select elements not found');
    return;
  }

  const names = Object.keys(data)
    .filter(k => Array.isArray(data[k]))
    .sort();

  names.forEach(name => {
    if (bankSelect) {
      const opt1 = document.createElement('option');
      opt1.value = name;
      opt1.textContent = formatBankName(name);
      bankSelect.appendChild(opt1);
    }
    if (statsSelect) {
      const opt2 = document.createElement('option');
      opt2.value = name;
      opt2.textContent = formatBankName(name);
      statsSelect.appendChild(opt2);
    }
  });

  // Mark as populated to prevent duplicates
  banksPopulated = true;
}

function getSelectedBank(id: string): BankData | null {
  const sel = document.getElementById(id) as HTMLSelectElement | null;
  if (!sel) {
    return null;
  }

  const bank = sel.value;
  if (!bank) {
    return null;
  }

  const files = bankFiles[bank];
  if (!Array.isArray(files) || !files.length) {
    return null;
  }

  return { bank, files };
}


function loadQuestion(): void {
  const data = getSelectedBank('bankSelect');
  if (!data) {
    alert('Please select a question bank');
    return;
  }

  const qs = data.files[Math.floor(Math.random() * data.files.length)];
  const q = qs[Math.floor(Math.random() * qs.length)];
  renderQuestion(q);
}

function renderQuestion(question: Question): void {
  // Store current question for button actions
  currentQuestion = question;
  selectedAnswer = '';

  // Store the selected bank for next time
  try {
    const bankSelect = document.getElementById(
      'bankSelect'
    ) as HTMLSelectElement | null;
    if (bankSelect && bankSelect.value) {
      localStorage.setItem('lastBank', bankSelect.value);
    }
  } catch (e) {
    console.warn('Failed to save lastBank', e);
  }

  // Ensure the question container has the required structure
  if (questionContainer && !questionContainer.dataset.initialized) {
    questionContainer.innerHTML = `
      <div id="questionTitle" class="question-title"></div>
      <div id="questionText" class="question-text"></div>
      <img id="questionImage" class="question-image" style="display:none;" />
      <div id="answerOptions" class="question-options"></div>
      <div id="calculatorInput" class="calculator" style="display:none;">
        <input type="number" id="calcInput" />
        <span id="answerUnit" class="unit"></span>
      </div>
    `;

    const optionsEl = questionContainer.querySelector('#answerOptions');
    if (optionsEl) {
      optionsEl.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.name === 'answer') {
          selectedAnswer = target.checked ? target.value : '';
        }
      });
    }

    questionContainer.dataset.initialized = 'true';
  }

  // Render question using the DOM-based renderer
  questionRenderer.renderQuestion(question);

  // Show the question area
  const questionArea = document.getElementById('questionArea');
  if (questionArea) {
    questionArea.style.display = 'block';
  }

  // Reset feedback
  const feedbackEl = document.getElementById('feedback');
  if (feedbackEl) {
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('correct', 'incorrect');
  }
}

function startPractice(): void {
  const data = getSelectedBank('bankSelect');
  if (!data) {
    alert('Please select a question bank');
    return;
  }

  // Get number of questions
  const numInput = document.getElementById('numInput') as HTMLInputElement;
  const numQuestions = numInput ? parseInt(numInput.value) || 10 : 10;

  // Check for existing session
  const sessionKey = `practice_session_${data.bank}_${numQuestions}`;
  const existingSession = sessionStorage.getItem(sessionKey);

  if (existingSession) {
    const confirmResume = confirm(
      'You have an unfinished practice session for this bank. Would you like to resume where you left off?'
    );
    if (confirmResume) {
      window.location.href = `practice.html?bank=${encodeURIComponent(data.bank)}&num=${numQuestions}&resume=true`;
      return;
    } else {
      // User wants to start fresh, clear the old session
      sessionStorage.removeItem(sessionKey);
    }
  }

  // Store the selected bank for next time
  try {
    localStorage.setItem('lastBank', data.bank);
  } catch (e) {
    console.warn('Failed to save lastBank', e);
  }

  // Redirect to practice page with bank and number parameters
  window.location.href = `practice.html?bank=${encodeURIComponent(data.bank)}&num=${numQuestions}`;
}

function checkAnswer(): void {
  if (!currentQuestion) {
    return;
  }

  // Get user answer first
  let userAnswer = '';

  if (currentQuestion.is_calculation) {
    const calcInput = document.getElementById('calcInput') as HTMLInputElement;
    if (!calcInput || !calcInput.value) {
      alert('Please enter an answer first');
      return;
    }
    userAnswer = calcInput.value;
  } else {
    if (!selectedAnswer) {
      alert('Please select an answer first');
      return;
    }
    userAnswer = selectedAnswer;
  }

  const isCorrect = evaluateAnswer(currentQuestion, userAnswer);
  revealAnswerWithFeedback(currentQuestion, isCorrect);
}

function revealAnswerWithFeedback(
  question: Question,
  isCorrect: boolean
): void {
  const feedbackEl = document.getElementById('feedback');
  const answerEl = document.getElementById('answer');
  const explanationEl = document.getElementById('explanation');

  if (feedbackEl) {
    feedbackEl.textContent = isCorrect ? 'Correct!' : 'Incorrect';
    feedbackEl.className = isCorrect
      ? 'feedback correct'
      : 'feedback incorrect';
  }

  if (answerEl) {
    const correctAnswerText = getCorrectAnswerText(question);
    answerEl.innerHTML = `<strong>Correct Answer:</strong> ${correctAnswerText}${
      question.answer_unit ? ' ' + question.answer_unit : ''
    }`;
    answerEl.style.display = 'block';
  }

  if (explanationEl && question.why) {
    explanationEl.innerHTML = `<strong>Explanation:</strong><br>${question.why}`;
    explanationEl.style.display = 'block';
  }
}

function revealAnswer(): void {
  if (!currentQuestion) {
    return;
  }

  // Use the same rendering logic but without feedback
  revealAnswerWithFeedback(currentQuestion, false);

  // Clear any existing feedback since this is just revealing the answer
  const feedbackEl = document.getElementById('feedback');
  if (feedbackEl) {
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
  }
}
