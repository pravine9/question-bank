import type { Question, QuestionBank, BankData } from '@/types/question';
import { formatBankName } from '@/utils/bankNames';
import { evaluateAnswer, getCorrectAnswerText, formatExplanation } from '@/utils/answers';
import { banks } from './banks';
import { questionRenderer } from './question_renderer';
import { QuestionStatisticsComponent } from '../src/components/questionStatistics';

const bankFiles: QuestionBank = banks;
let banksPopulated = false;
let questionStatsComponent: QuestionStatisticsComponent | null = null;

// Add event handlers for question buttons
let currentQuestion: Question | null = null;

// Make utility functions globally available for questionRenderer
(window as any).evaluateAnswer = evaluateAnswer;
(window as any).getCorrectAnswerText = getCorrectAnswerText;
(window as any).formatExplanation = formatExplanation;

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
    checkBtn.addEventListener('click', toggleCheck);
  }

  const revealBtn = document.getElementById('revealBtn') as HTMLButtonElement | null;
  if (revealBtn) {
    revealBtn.addEventListener('click', toggleReveal);
  }

  // Wait for question banks to be loaded before initializing components
  setTimeout(() => {
    // Re-import banks to get the latest data after scripts are loaded
    const updatedBanks = {
      calculations: [ (window as any).calculations || [] ],
      clinical_mep: [ (window as any).clinicalMepLow || [] ],
      clinical_mixed: [
        (window as any).clinicalMixedHigh || [],
        (window as any).clinicalMixedLow || [],
        (window as any).clinicalMixedMedium || [],
      ],
      clinical_otc: [ (window as any).clinicalOtcLow || [] ],
      clinical_therapeutics: [
        (window as any).clinicalTherapeuticsHigh || [],
        (window as any).clinicalTherapeuticsLow || [],
        (window as any).clinicalTherapeuticsMedium || [],
      ],
    };

    // Initialize question statistics component with updated data
    questionStatsComponent = new QuestionStatisticsComponent(updatedBanks);
    questionStatsComponent.render('statsArea');

    // Update the global bankFiles reference
    Object.assign(bankFiles, updatedBanks);

    // Populate bank selects with updated data
    populateBankSelects(updatedBanks);
  }, 100);

  const params = new URLSearchParams(window.location.search);
  if (params.get('isStandAlone') === 'true') {
    document.body.classList.add('standalone');
    const container = document.querySelector('.container');
    if (container) {
      container.classList.add('standalone');
    }
  }

  // Initial population with existing data (will be updated after timeout)
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

  questionRenderer.initPdfViewer();
}

function populateBankSelects(data: QuestionBank): void {
  // Prevent duplicate population
  if (banksPopulated) {
    return;
  }

  const bankSelect = document.getElementById(
    'bankSelect'
  ) as HTMLSelectElement | null;

  if (!bankSelect) {
    console.warn('Bank select element not found');
    return;
  }

  const names = Object.keys(data)
    .filter(k => Array.isArray(data[k]))
    .sort();

  names.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = formatBankName(name);
    bankSelect.appendChild(opt);
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

  // Render the question using the question renderer
  if (questionRenderer) {
    questionRenderer.renderQuestion(question, {
      text: '#qText',
      title: '#qTitle',
      img: '#qImg',
      options: '#answerOptions',
      input: '.calculator',
      unit: '#answerUnit',
      feedback: '#feedback',
      answer: '#answer',
      explanation: '#explanation',
    });
  }

  // Show the question area
  const questionArea = document.getElementById('questionArea');
  if (questionArea) {
    questionArea.style.display = 'block';
  }

  // Reset feedback and buttons
  const feedbackEl = document.getElementById('feedback');
  if (feedbackEl) {
    feedbackEl.textContent = '';
    feedbackEl.classList.remove('correct', 'incorrect');
  }

  // Reset answer and explanation visibility
  const answerEl = document.getElementById('answer');
  const explanationEl = document.getElementById('explanation');
  if (answerEl) {
    answerEl.style.display = 'none';
    answerEl.innerHTML = '';
  }
  if (explanationEl) {
    explanationEl.style.display = 'none';
    explanationEl.innerHTML = '';
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

function getUserAnswer(): string {
  if (!currentQuestion) {
    return '';
  }

  if (currentQuestion.is_calculation) {
    const calcInput = document.getElementById('calcInput') as HTMLInputElement;
    return calcInput?.value || '';
  } else {
    const selectedOption = document.querySelector(
      'input[name="answer"]:checked'
    ) as HTMLInputElement;
    return selectedOption?.value || '';
  }
}

function toggleCheck(): void {
  if (!currentQuestion || !questionRenderer) {
    return;
  }
  
  const currentState = questionRenderer.getCurrentDisplayState();
  
  if (currentState === 'checked') {
    questionRenderer.displayAnswer(currentQuestion, 'hide');
  } else {
    const userAnswer = getUserAnswer();
    questionRenderer.displayAnswer(currentQuestion, 'check', userAnswer);
    
    // Record statistics when user checks their answer
    if (userAnswer && questionStatsComponent) {
      const bankSelect = document.getElementById('bankSelect') as HTMLSelectElement;
      if (bankSelect && bankSelect.value) {
        const bankName = bankSelect.value;
        // Use the question's id for consistent tracking
        const questionId = currentQuestion.id.toString();
        const isCorrect = evaluateAnswer(currentQuestion, userAnswer);
        questionStatsComponent.recordQuestionAttempt(bankName, questionId, isCorrect);
      }
    }
  }
}

function toggleReveal(): void {
  if (!currentQuestion || !questionRenderer) {
    return;
  }
  
  const currentState = questionRenderer.getCurrentDisplayState();
  
  if (currentState === 'revealed') {
    questionRenderer.displayAnswer(currentQuestion, 'hide');
  } else {
    questionRenderer.displayAnswer(currentQuestion, 'reveal');
  }
}


