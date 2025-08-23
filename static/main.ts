// Type definitions moved inline to avoid import issues

interface Question {
  id: number;
  bank: string;
  title: string;
  text: string;
  why: string;
  resource_image?: string | null;
  visible: boolean;
  is_calculation: boolean;
  correct_answer: string;
  answer_unit?: string;
  correct_answer_number?: number | null;
  weighting?: number | null;
  answers: Array<{text: string; answer_number: number}>;
  is_free: boolean;
}

interface QuestionBank {
  [key: string]: Question[][];
}

interface BankData {
  bank: string;
  files: Question[][];
}

interface BankLabels {
  [key: string]: string;
}

let bankFiles: QuestionBank = window.banks || {};
const flagged = new Set<number>();

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

function populateBankSelects(data: QuestionBank): void {
  console.log('populateBankSelects called with:', data);
  
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

window.toggleFlag = toggleFlag;

// Make populateBankSelects available globally
window.populateBankSelects = populateBankSelects;
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
  if (window.banks) {
    bankFiles = window.banks;
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
  
  if (window.questionRenderer) {
    window.questionRenderer.initPdfViewer();
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
  
  // Show the question area
  const questionArea = document.getElementById('questionArea');
  if (questionArea) {
    questionArea.style.display = 'block';
  }
  
  // Reset feedback
  const feedbackEl = document.getElementById('questionFeedback');
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
  
  // Store the selected bank for next time
  try {
    localStorage.setItem('lastBank', data.bank);
  } catch (e) {
    console.warn('Failed to save lastBank', e);
  }
  
  // Redirect to practice page with bank parameter
  window.location.href = `practice.html?bank=${encodeURIComponent(data.bank)}`;
}

// Functions are available globally via window object
// No need to export since we're not using ES modules in HTML
