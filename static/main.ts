import type {
  Question,
  QuestionBank,
  BankData,
  BankLabels,
} from '@/types/question';

let bankFiles: QuestionBank = (window as any).banks || {};
const flagged = new Set<number>();
let banksPopulated = false;

const bankLabels: BankLabels = {
  calculations: 'Calculations',
  clinical_mep: 'Clinical MEP',
  clinical_mixed: 'Clinical Mixed',
  clinical_otc: 'Clinical OTC',
  clinical_therapeutics: 'Clinical Therapeutics'
};

const loadBtn = document.getElementById('loadBtn') as HTMLButtonElement | null;
if (loadBtn) {loadBtn.addEventListener('click', loadQuestion);}

const practiceBtn = document.getElementById('practiceBtn') as HTMLButtonElement | null;
if (practiceBtn) {practiceBtn.addEventListener('click', startPractice);}

// Add event handlers for question buttons
let currentQuestion: Question | null = null;

const checkBtn = document.getElementById('checkBtn') as HTMLButtonElement | null;
if (checkBtn) {checkBtn.addEventListener('click', checkAnswer);}

const revealBtn = document.getElementById('revealBtn') as HTMLButtonElement | null;
if (revealBtn) {revealBtn.addEventListener('click', revealAnswer);}



function populateBankSelects(data: QuestionBank): void {
  console.log('populateBankSelects called with:', data);
  
  // Prevent duplicate population
  if (banksPopulated) {
    console.log('Banks already populated, skipping...');
    return;
  }
  
  const bankSelect = document.getElementById('bankSelect') as HTMLSelectElement | null;
  const statsSelect = document.getElementById('statsBankSelect') as HTMLSelectElement | null;
  
  if (!bankSelect && !statsSelect) {
    console.log('Bank select elements not found');
    return;
  }
  
  const names = Object.keys(data)
    .filter(k => Array.isArray(data[k]))
    .sort();
    
  console.log('Bank names found:', names);
    
  names.forEach(name => {
    if (bankSelect) {
      const opt1 = document.createElement('option');
      opt1.value = name;
      opt1.textContent = bankLabels[name] || name;
      bankSelect.appendChild(opt1);
      console.log('Added option:', name);
    }
    if (statsSelect) {
      const opt2 = document.createElement('option');
      opt2.value = name;
      opt2.textContent = bankLabels[name] || name;
      statsSelect.appendChild(opt2);
    }
  });
  
  // Mark as populated to prevent duplicates
  banksPopulated = true;
  console.log('Banks population completed');
}

function getSelectedBank(id: string): BankData | null {
  const sel = document.getElementById(id) as HTMLSelectElement | null;
  if (!sel) {return null;}
  
  const bank = sel.value;
  if (!bank) {return null;}
  
  const files = bankFiles[bank];
  if (!Array.isArray(files) || !files.length) {return null;}
  
  return { bank, files };
}

function toggleFlag(id: number): boolean {
  if (flagged.has(id)) {
    flagged.delete(id);
    return false;
  }
  flagged.add(id);
  return true;
}

(window as any).toggleFlag = toggleFlag;

// Make populateBankSelects available globally
(window as any).populateBankSelects = populateBankSelects;
console.log('main.ts loaded, populateBankSelects exposed globally');

// Adjust layout when loaded in standalone mode
document.addEventListener('DOMContentLoaded', function() {
  // Ensure statsModal is hidden by default
  const statsModal = document.getElementById('statsModal');
  if (statsModal) {
    statsModal.classList.remove('show');
  }
  
  const params = new URLSearchParams(window.location.search);
  if (params.get('isStandAlone') === 'true') {
    document.body.classList.add('standalone');
    const container = document.querySelector('.container');
    if (container) {container.classList.add('standalone');}
  }
  
  // Update bankFiles if banks have been loaded
  if ((window as any).banks) {
    bankFiles = (window as any).banks;
    console.log('Banks found in window, populating selects...');
    populateBankSelects(bankFiles);
  } else {
    console.log('No banks found in window yet');
  }
  
  // Preselect the last used bank if available
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
  
  if ((window as any).questionRenderer) {
    (window as any).questionRenderer.initPdfViewer();
  }
});

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
    const bankSelect = document.getElementById('bankSelect') as HTMLSelectElement | null;
    if (bankSelect && bankSelect.value) {
      localStorage.setItem('lastBank', bankSelect.value);
    }
  } catch (e) {
    console.warn('Failed to save lastBank', e);
  }
  
  // Render the question using the question renderer
  if ((window as any).questionRenderer) {
    (window as any).questionRenderer.renderQuestion(question, {
      text: '#qText',
      title: '#qTitle',
      img: '#qImg',
      options: '#answerOptions',
      input: '.calculator',
      unit: '#answerUnit',
      feedback: '#feedback',
      answer: '#answer',
      explanation: '#explanation'
    });
  }
  
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
    const selectedOption = document.querySelector('input[name="answer"]:checked') as HTMLInputElement;
    if (!selectedOption) {
      alert('Please select an answer first');
      return;
    }
    userAnswer = selectedOption.value;
  }
  
  const isCorrect = evaluateAnswer(currentQuestion, userAnswer);
  revealAnswerWithFeedback(currentQuestion, isCorrect);
}

function evaluateAnswer(question: Question, userAnswer: string): boolean {
  if (!question || !userAnswer) {
    return false;
  }

  if (question.is_free) {
    return userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
  }
  
  if (question.is_calculation) {
    const userNum = parseFloat(userAnswer);
    const correctNum = question.correct_answer_number || parseFloat(question.correct_answer);
    if (isNaN(userNum) || isNaN(correctNum)) {
      return false;
    }
    
    const tolerance = Math.abs(correctNum * 0.05); // 5% tolerance
    return Math.abs(userNum - correctNum) <= tolerance;
  }
  
  // Multiple choice - use correct_answer_number directly
  const correctAnswerNumber = question.correct_answer_number;
  if (correctAnswerNumber === undefined || correctAnswerNumber === null) {
    return false;
  }
  return parseInt(userAnswer) === correctAnswerNumber;
}

function revealAnswerWithFeedback(question: Question, isCorrect: boolean): void {
  const feedbackEl = document.getElementById('feedback');
  const answerEl = document.getElementById('answer');
  const explanationEl = document.getElementById('explanation');

  if (feedbackEl) {
    feedbackEl.textContent = isCorrect ? 'Correct!' : 'Incorrect';
    feedbackEl.className = isCorrect ? 'feedback correct' : 'feedback incorrect';
  }

  if (answerEl) {
    let correctAnswerText = question.correct_answer;
    
    // For multiple choice questions, find the correct answer text
    if (!correctAnswerText && question.correct_answer_number && question.answers) {
      const correctAnswer = question.answers.find(a => a.answer_number === question.correct_answer_number);
      correctAnswerText = correctAnswer ? correctAnswer.text : 'N/A';
    }
    
    answerEl.innerHTML = `<strong>Correct Answer:</strong> ${correctAnswerText || 'N/A'}${question.answer_unit ? ' ' + question.answer_unit : ''}`;
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



// Functions are available globally via window object
// No need to export since we're not using ES modules in HTML
