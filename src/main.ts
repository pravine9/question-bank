// Main entry point for the application
import type { Question, QuestionBank } from './types/question';
import { QuestionRenderer } from './utils/questionRenderer';

// Global interfaces for window object
declare global {
  interface Window {
    // Question bank data (loaded by question bank JS files)
    calculations?: Question[];
    clinicalMepLow?: Question[];
    clinicalMixedHigh?: Question[];
    clinicalMixedLow?: Question[];
    clinicalMixedMedium?: Question[];
    clinicalOtcLow?: Question[];
    clinicalTherapeuticsHigh?: Question[];
    clinicalTherapeuticsLow?: Question[];
    clinicalTherapeuticsMedium?: Question[];
    
    // Application state
    banks?: QuestionBank;
    questionRenderer?: QuestionRenderer;
    toggleFlag?: (id: number) => boolean;
  }
}

interface BankData {
  bank: string;
  files: Question[][];
}

interface BankLabels {
  [key: string]: string;
}

// Application state
let bankFiles: QuestionBank = {};
const flagged = new Set<number>();

const bankLabels: BankLabels = {
  calculations: 'Calculations',
  clinical_mep: 'Clinical MEP',
  clinical_mixed: 'Clinical Mixed',
  clinical_otc: 'Clinical OTC',
  clinical_therapeutics: 'Clinical Therapeutics'
};

// Initialize question renderer
const questionRenderer = QuestionRenderer.getInstance();

function initializeBanks(): void {
  console.log('Initializing banks...');
  
  const banks: QuestionBank = {
    calculations: [window.calculations || []],
    clinical_mep: [window.clinicalMepLow || []],
    clinical_mixed: [window.clinicalMixedHigh || [], window.clinicalMixedLow || [], window.clinicalMixedMedium || []],
    clinical_otc: [window.clinicalOtcLow || []],
    clinical_therapeutics: [window.clinicalTherapeuticsHigh || [], window.clinicalTherapeuticsLow || [], window.clinicalTherapeuticsMedium || []]
  };

  console.log('Banks object:', banks);
  window.banks = banks;
  bankFiles = banks;
  
  populateBankSelects(banks);
}

function populateBankSelects(data: QuestionBank): void {
  console.log('populateBankSelects called with:', data);
  
  const bankSelect = document.getElementById('bankSelect') as HTMLSelectElement | null;
  const statsSelect = document.getElementById('statsBankSelect') as HTMLSelectElement | null;
  
  if (!bankSelect && !statsSelect) {
    console.log('Bank select elements not found');
    return;
  }
  
  const names = Object.keys(data)
    .filter(k => Array.isArray(data[k]) && data[k].length > 0)
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
}

function getSelectedBank(id: string): BankData | null {
  const sel = document.getElementById(id) as HTMLSelectElement | null;
  if (!sel) return null;
  
  const bank = sel.value;
  if (!bank) return null;
  
  const files = bankFiles[bank];
  if (!Array.isArray(files) || !files.length) return null;
  
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
  questionRenderer.renderQuestion(question, {
    text: '#qText',
    title: '#qTitle',
    options: '#answerOptions',
    input: '#calcInput',
    unit: '#answerUnit',
    feedback: '#feedback',
    answer: '#correctAnswer',
    explanation: '#explanation',
    showInput: true
  });
  
  // Show the question area
  const questionArea = document.getElementById('questionArea');
  if (questionArea) {
    questionArea.style.display = 'block';
  }
}

function startPractice(): void {
  const data = getSelectedBank('bankSelect');
  if (!data) {
    alert('Please select a question bank');
    return;
  }
  
  // Store the selected bank for next time
  try {
    localStorage.setItem('lastBank', data.bank);
  } catch (e) {
    console.warn('Failed to save lastBank', e);
  }
  
  // Redirect to practice page with bank parameter
  window.location.href = `practice.html?bank=${encodeURIComponent(data.bank)}`;
}

// Make functions available globally
window.questionRenderer = questionRenderer;
window.toggleFlag = toggleFlag;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing application...');
  
  // Setup modal
  const statsModal = document.getElementById('statsModal');
  if (statsModal) {
    statsModal.classList.remove('show');
  }
  
  // Handle standalone mode
  const params = new URLSearchParams(window.location.search);
  if (params.get('isStandAlone') === 'true') {
    document.body.classList.add('standalone');
    const container = document.querySelector('.container');
    if (container) container.classList.add('standalone');
  }
  
  // Setup event listeners
  const loadBtn = document.getElementById('loadBtn');
  if (loadBtn) loadBtn.addEventListener('click', loadQuestion);
  
  const practiceBtn = document.getElementById('practiceBtn');
  if (practiceBtn) practiceBtn.addEventListener('click', startPractice);
  
  // Initialize banks (wait a bit for question bank files to load)
  setTimeout(initializeBanks, 100);
  
  // Preselect the last used bank if available
  setTimeout(() => {
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
  }, 200);
});

console.log('Main application script loaded');