// Practice Mode Logic - Full Implementation
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

interface PracticeState {
  currentQuestion: number;
  questions: Question[];
  answers: { [key: number]: string };
  flagged: Set<number>;
  startTime: number;
  bank: string;
  totalQuestions: number;
}

// Timer constants
const TIMER_CONSTANTS = {
  TIME_PER_QUESTION: 120, // 2 minutes per question in seconds
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MILLISECONDS_PER_MINUTE: 60000,
  WARNING_DISPLAY_TIME: 5000, // 5 seconds
  WARNING_THRESHOLDS: {
    WARNING: 300, // 5 minutes in seconds
    DANGER: 60    // 1 minute in seconds
  }
};

interface TimerWarning {
  threshold: number;
  shown: boolean;
  type: 'warning' | 'danger';
  message: string;
}

// Timer implementation
class PracticeTimer {
  private timePerQuestion: number;
  private totalTime: number;
  private remainingTime: number;
  private startTime: number;
  private timerElement: HTMLElement | null;
  private timerId: NodeJS.Timeout | null;
  private isPaused: boolean;
  private onTimeUp: () => void;
  private onWarning: () => void;
  private warnings: TimerWarning[];

  constructor(totalQuestions: number, onTimeUp?: () => void, onWarning?: () => void) {
    this.timePerQuestion = TIMER_CONSTANTS.TIME_PER_QUESTION;
    this.totalTime = totalQuestions * this.timePerQuestion;
    this.remainingTime = this.totalTime;
    this.startTime = Date.now();
    this.timerElement = null;
    this.timerId = null;
    this.isPaused = false;
    this.onTimeUp = onTimeUp || (() => {});
    this.onWarning = onWarning || (() => {});
    
    this.warnings = [
      { threshold: 10, shown: false, type: 'warning', message: '10 minutes remaining' },
      { threshold: 5, shown: false, type: 'warning', message: '5 minutes remaining' },
      { threshold: 1, shown: false, type: 'danger', message: '1 minute remaining - Final warning!' }
    ];
  }

  initTimer(elementId: string): void {
    this.timerElement = document.getElementById(elementId);
    if (!this.timerElement) {
      console.warn('Timer element not found:', elementId);
    return;
  }
  
    this.updateDisplay();
    this.start();
  }

  start(savedStartTime?: number): void {
    if (savedStartTime) {
      this.startTime = savedStartTime;
      const elapsed = Math.floor((Date.now() - savedStartTime) / 1000);
      this.remainingTime = Math.max(0, this.totalTime - elapsed);
    }
    
    this.isPaused = false;
    this.updateDisplay();
    
    this.timerId = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, 1000);
  }

  private tick(): void {
    if (this.remainingTime <= 0) {
      this.handleTimeUp();
      return;
    }

    this.remainingTime--;
    this.updateDisplay();
    this.checkWarnings();
  }

  private updateDisplay(): void {
    if (!this.timerElement) return;

    this.timerElement.textContent = this.formatTime(this.remainingTime);
    
    this.timerElement.className = 'timer';
    if (this.remainingTime <= TIMER_CONSTANTS.WARNING_THRESHOLDS.DANGER) {
      this.timerElement.classList.add('danger');
    } else if (this.remainingTime <= TIMER_CONSTANTS.WARNING_THRESHOLDS.WARNING) {
      this.timerElement.classList.add('warning');
    }
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return hours > 0 
      ? `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(secs)}`
      : `${this.pad(minutes)}:${this.pad(secs)}`;
  }

  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }

  private checkWarnings(): void {
    const remainingMinutes = Math.floor(this.remainingTime / 60);
    
    this.warnings.forEach(warning => {
      if (!warning.shown && remainingMinutes <= warning.threshold) {
        warning.shown = true;
        this.showWarning(warning.message, warning.type);
        this.onWarning();
      }
    });
  }

  private showWarning(message: string, type: 'warning' | 'danger'): void {
    const warningEl = document.createElement('div');
    warningEl.className = `timer-warning ${type}`;
    warningEl.textContent = message;
    
    document.body.appendChild(warningEl);
    
    setTimeout(() => {
      if (warningEl.parentNode) {
        warningEl.parentNode.removeChild(warningEl);
      }
    }, TIMER_CONSTANTS.WARNING_DISPLAY_TIME);
  }

  private handleTimeUp(): void {
    this.remainingTime = 0;
    this.stop();
    this.updateDisplay();
    this.onTimeUp();
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  getElapsedTime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getElapsedMinutes(): number {
    return Math.floor(this.getElapsedTime() / 60);
  }
}

class PracticeManager {
  private state: PracticeState | null = null;
  private timer: PracticeTimer;
  private isFinished: boolean = false;

  constructor() {
    this.timer = new PracticeTimer(10, () => this.handleTimeUp());
  }

  init(): void {
    const params = new URLSearchParams(window.location.search);
    const bank = params.get('bank');
    const numQuestions = parseInt(params.get('num') || '10');

    if (!bank || !window.banks || !window.banks[bank]) {
      alert('No valid question bank selected');
      window.location.href = 'index.html';
      return;
    }

    this.setupPracticeSession(bank, numQuestions);
    this.setupEventListeners();
    this.renderCurrentQuestion();
    
    // Initialize timer with correct number of questions
    this.timer = new PracticeTimer(numQuestions, () => this.handleTimeUp());
    this.timer.initTimer('timer');
  }

  private setupPracticeSession(bank: string, numQuestions: number): void {
    const bankData = window.banks![bank];
    if (!bankData || !bankData.length) {
      alert('Question bank is empty');
      return;
    }

    // Flatten all questions from all files in the bank
    const allQuestions: Question[] = [];
    bankData.forEach(questionArray => {
      allQuestions.push(...questionArray);
    });

    // Shuffle and select questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(numQuestions, shuffled.length));

    this.state = {
      currentQuestion: 0,
      questions: selectedQuestions,
      answers: {},
      flagged: new Set(),
      startTime: Date.now(),
      bank,
      totalQuestions: selectedQuestions.length
    };

    // Update UI
    const titleEl = document.querySelector('.test-title');
    if (titleEl) {
      titleEl.textContent = `${this.formatBankName(bank)} - ${selectedQuestions.length} Questions`;
    }

    this.setupNavigation();
    this.updateProgress();
  }

  private setupNavigation(): void {
    if (!this.state) return;

    const nav = document.querySelector('.sidebar .nav');
    if (!nav) return;

    nav.innerHTML = '';
    for (let i = 0; i < this.state.totalQuestions; i++) {
      const li = document.createElement('li');
      li.innerHTML = `
        <button class="nav-btn" data-question="${i}">
          <span class="question-number">${i + 1}</span>
          <span class="status-indicator"></span>
        </button>
      `;
      nav.appendChild(li);
    }

    // Add click handlers
    nav.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.nav-btn') as HTMLButtonElement;
      if (btn) {
        const questionNum = parseInt(btn.dataset.question || '0');
        this.goToQuestion(questionNum);
      }
    });
  }

  private setupEventListeners(): void {
    // Navigation buttons
    const backBtn = document.querySelector('.back-btn') as HTMLButtonElement;
    const nextBtn = document.querySelector('.next-btn') as HTMLButtonElement;
    const flagBtn = document.querySelector('.flag-current-btn') as HTMLButtonElement;
    const finishBtn = document.querySelector('.finish-btn') as HTMLButtonElement;
    const checkBtn = document.getElementById('checkBtn') as HTMLButtonElement;

    if (backBtn) {
      backBtn.addEventListener('click', () => this.previousQuestion());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }
    if (flagBtn) {
      flagBtn.addEventListener('click', () => this.toggleFlag());
    }
    if (finishBtn) {
      finishBtn.addEventListener('click', () => this.finishTest());
    }
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this.checkAnswer());
    }

    // Answer selection handling
    document.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.name === 'answer' || target.id === 'calcInput') {
        this.saveAnswer();
      }
    });

    // Review status modal
    const reviewBtn = document.querySelector('.review-status-btn') as HTMLButtonElement;
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => this.showReviewModal());
    }

    const modalClose = document.querySelector('.modal-close') as HTMLButtonElement;
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideReviewModal());
    }
  }

  private renderCurrentQuestion(): void {
    if (!this.state || this.state.currentQuestion >= this.state.questions.length) return;

    const question = this.state.questions[this.state.currentQuestion];
    
    // Update question number
    const qNumEl = document.querySelector('.q-number');
    if (qNumEl) {
      qNumEl.textContent = `Question ${this.state.currentQuestion + 1}`;
    }

    // Render question using global renderer
    if (window.questionRenderer) {
      window.questionRenderer.renderQuestion(question, {
        text: '#qText',
        title: '#qTitle',
        img: '#qImg',
        options: '#answerOptions',
        input: '#calcInput',
        unit: '#answerUnit',
        feedback: '#feedback',
        answer: '#answer',
        explanation: '#explanation'
      });
    }

    // Restore saved answer
    const savedAnswer = this.state.answers[this.state.currentQuestion];
    if (savedAnswer) {
      if (question.is_calculation) {
        const input = document.getElementById('calcInput') as HTMLInputElement;
        if (input) input.value = savedAnswer;
      } else {
        const radio = document.querySelector(`input[name="answer"][value="${savedAnswer}"]`) as HTMLInputElement;
        if (radio) radio.checked = true;
      }
    }

    this.updateNavigation();
    this.updateProgress();
  }

  private formatBankName(bank: string): string {
    const bankNames: { [key: string]: string } = {
      'calculations': 'Calculations',
      'clinical_mep': 'Clinical MEP',
      'clinical_mixed': 'Clinical Mixed',
      'clinical_otc': 'Clinical OTC',
      'clinical_therapeutics': 'Clinical Therapeutics'
    };
    return bankNames[bank] || bank;
  }

  private saveAnswer(): void {
    if (!this.state) return;

    const question = this.state.questions[this.state.currentQuestion];
    let answer = '';

    if (question.is_calculation) {
      const input = document.getElementById('calcInput') as HTMLInputElement;
      answer = input?.value || '';
    } else {
      const selected = document.querySelector('input[name="answer"]:checked') as HTMLInputElement;
      answer = selected?.value || '';
    }

    if (answer) {
      this.state.answers[this.state.currentQuestion] = answer;
      this.updateNavigation();
    }
  }

  private updateProgress(): void {
    if (!this.state) return;

    const progressBar = document.querySelector('.progress .bar') as HTMLElement;
    const answeredCount = Object.keys(this.state.answers).length;
    const progress = (answeredCount / this.state.totalQuestions) * 100;

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  private updateNavigation(): void {
    if (!this.state) return;

    // Update navigation buttons
    const backBtn = document.querySelector('.back-btn') as HTMLButtonElement;
    const nextBtn = document.querySelector('.next-btn') as HTMLButtonElement;
    const flagBtn = document.querySelector('.flag-current-btn') as HTMLButtonElement;

    if (backBtn) {
      backBtn.disabled = this.state.currentQuestion === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = this.state.currentQuestion === this.state.totalQuestions - 1;
    }
    if (flagBtn) {
      flagBtn.classList.toggle('active', this.state.flagged.has(this.state.currentQuestion));
    }

    // Update sidebar navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach((btn, index) => {
      const button = btn as HTMLButtonElement;
      button.classList.remove('current', 'answered', 'flagged');
      
      if (index === this.state!.currentQuestion) {
        button.classList.add('current');
      }
      if (this.state!.answers[index]) {
        button.classList.add('answered');
      }
      if (this.state!.flagged.has(index)) {
        button.classList.add('flagged');
      }
    });
  }

  private goToQuestion(questionNum: number): void {
    if (!this.state || questionNum < 0 || questionNum >= this.state.totalQuestions) return;

    this.state.currentQuestion = questionNum;
    this.renderCurrentQuestion();
  }

  private previousQuestion(): void {
    if (!this.state || this.state.currentQuestion <= 0) return;
    this.goToQuestion(this.state.currentQuestion - 1);
  }

  private nextQuestion(): void {
    if (!this.state || this.state.currentQuestion >= this.state.totalQuestions - 1) return;
    this.goToQuestion(this.state.currentQuestion + 1);
  }

  private toggleFlag(): void {
    if (!this.state) return;

    const questionNum = this.state.currentQuestion;
    if (this.state.flagged.has(questionNum)) {
      this.state.flagged.delete(questionNum);
    } else {
      this.state.flagged.add(questionNum);
    }

    this.updateNavigation();
  }

  private checkAnswer(): void {
    if (!this.state) return;

    const question = this.state.questions[this.state.currentQuestion];
    const userAnswer = this.state.answers[this.state.currentQuestion];

    if (!userAnswer) {
      alert('Please select an answer first');
      return;
    }

    const isCorrect = this.evaluateAnswer(question, userAnswer);
    this.revealAnswer(question, isCorrect);
  }

  private evaluateAnswer(question: Question, userAnswer: string): boolean {
    if (question.is_free) {
      return userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    }
    
    if (question.is_calculation) {
      const userNum = parseFloat(userAnswer);
      const correctNum = question.correct_answer_number || parseFloat(question.correct_answer);
      if (isNaN(userNum) || isNaN(correctNum)) return false;
      
      const tolerance = Math.abs(correctNum * 0.05); // 5% tolerance
      return Math.abs(userNum - correctNum) <= tolerance;
    }
    
    // Multiple choice
    const correctAnswerNumber = question.answers.find(a => a.text === question.correct_answer)?.answer_number;
    return parseInt(userAnswer) === correctAnswerNumber;
  }

  private revealAnswer(question: Question, isCorrect: boolean): void {
    const feedbackEl = document.getElementById('feedback');
    const answerEl = document.getElementById('answer');
    const explanationEl = document.getElementById('explanation');

    if (feedbackEl) {
      feedbackEl.textContent = isCorrect ? 'Correct!' : 'Incorrect';
      feedbackEl.className = isCorrect ? 'feedback correct' : 'feedback incorrect';
    }

    if (answerEl) {
      answerEl.innerHTML = `<strong>Correct Answer:</strong> ${question.correct_answer}${question.answer_unit ? ' ' + question.answer_unit : ''}`;
      answerEl.style.display = 'block';
    }

    if (explanationEl && question.why) {
      explanationEl.innerHTML = `<strong>Explanation:</strong> ${question.why}`;
      explanationEl.style.display = 'block';
    }
  }

  private finishTest(): void {
    if (!this.state) return;

    const answeredCount = Object.keys(this.state.answers).length;
    const unanswered = this.state.totalQuestions - answeredCount;

    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered questions. Are you sure you want to finish the test?`
      );
      if (!confirm) return;
    }

    this.timer.stop();
    this.calculateResults();
    this.showSummary();
  }

  private handleTimeUp(): void {
    if (this.isFinished) return;
    
    alert('Time is up! The test will be finished automatically.');
    this.finishTest();
  }

  private calculateResults(): void {
    if (!this.state) return;

    let correctCount = 0;
    const duration = this.timer.getElapsedMinutes();

    // Check answers
    for (let i = 0; i < this.state.questions.length; i++) {
      const question = this.state.questions[i];
      const userAnswer = this.state.answers[i];
      
      if (userAnswer && this.evaluateAnswer(question, userAnswer)) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / this.state.totalQuestions) * 100);

    // Save to history
    this.savePracticeResult({
      id: Date.now().toString(),
      bank: this.state.bank,
      totalQuestions: this.state.totalQuestions,
      correctAnswers: correctCount,
      score,
      duration,
      date: new Date().toISOString(),
      flaggedQuestions: this.state.flagged.size
    });

    this.isFinished = true;
  }

  private showSummary(): void {
    // Hide main content and show summary
    const main = document.querySelector('.main') as HTMLElement;
    const header = document.querySelector('.header') as HTMLElement;
    const footer = document.querySelector('.footer') as HTMLElement;
    const summary = document.querySelector('.summary') as HTMLElement;

    if (main) main.style.display = 'none';
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (summary) summary.style.display = 'block';

    this.populateSummaryTable();
  }

  private populateSummaryTable(): void {
    if (!this.state) return;

    const tbody = document.querySelector('.summary-table tbody') as HTMLTableSectionElement;
    const scoreDisplay = document.getElementById('scoreDisplay') as HTMLElement;
    const percentageDisplay = document.getElementById('percentageDisplay') as HTMLElement;

    if (!tbody) return;

    let correctCount = 0;
    tbody.innerHTML = '';

    for (let i = 0; i < this.state.questions.length; i++) {
      const question = this.state.questions[i];
      const userAnswer = this.state.answers[i] || 'No answer';
      const isCorrect = userAnswer !== 'No answer' && this.evaluateAnswer(question, userAnswer);
      
      if (isCorrect) correctCount++;

      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${userAnswer}</td>
        <td>${question.correct_answer}</td>
        <td class="${isCorrect ? 'correct' : 'incorrect'}">${isCorrect ? 'Correct' : 'Incorrect'}</td>
        <td><button class="btn btn-sm review-question" data-question="${i}">Review</button></td>
      `;
    }

    const score = Math.round((correctCount / this.state.totalQuestions) * 100);
    if (scoreDisplay) scoreDisplay.textContent = `${correctCount}/${this.state.totalQuestions}`;
    if (percentageDisplay) percentageDisplay.textContent = `(${score}%)`;

    // Add review handlers
    tbody.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.review-question') as HTMLButtonElement;
      if (btn) {
        const questionNum = parseInt(btn.dataset.question || '0');
        this.reviewQuestion(questionNum);
      }
    });

    // Add go home handler
    const goHomeBtn = document.getElementById('goHome') as HTMLButtonElement;
    if (goHomeBtn) {
      goHomeBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
      });
    }
  }

  private reviewQuestion(questionNum: number): void {
    // Hide summary and show question for review
    const main = document.querySelector('.main') as HTMLElement;
    const header = document.querySelector('.header') as HTMLElement;
    const footer = document.querySelector('.footer') as HTMLElement;
    const summary = document.querySelector('.summary') as HTMLElement;

    if (main) main.style.display = 'block';
    if (header) header.style.display = 'block';
    if (footer) footer.style.display = 'block';
    if (summary) summary.style.display = 'none';

    // Go to the question
    this.goToQuestion(questionNum);

    // Auto-reveal the answer for review
    const question = this.state!.questions[questionNum];
    const userAnswer = this.state!.answers[questionNum];
    if (userAnswer) {
      const isCorrect = this.evaluateAnswer(question, userAnswer);
      this.revealAnswer(question, isCorrect);
    }
  }

  private showReviewModal(): void {
    if (!this.state) return;

    const modal = document.getElementById('reviewModal');
    if (!modal) return;

    // Update counts
    const attemptedCount = Object.keys(this.state.answers).length;
    const notAttemptedCount = this.state.totalQuestions - attemptedCount;
    const flaggedCount = this.state.flagged.size;

    const attemptedEl = document.getElementById('attemptedCount');
    const notAttemptedEl = document.getElementById('notAttemptedCount');
    const flaggedEl = document.getElementById('flaggedCount');

    if (attemptedEl) attemptedEl.textContent = attemptedCount.toString();
    if (notAttemptedEl) notAttemptedEl.textContent = notAttemptedCount.toString();
    if (flaggedEl) flaggedEl.textContent = flaggedCount.toString();

    // Generate question grid
    const gridEl = document.getElementById('questionGridReview');
    if (gridEl) {
      gridEl.innerHTML = '';
      for (let i = 0; i < this.state.totalQuestions; i++) {
        const btn = document.createElement('button');
        btn.className = 'grid-question';
        btn.textContent = (i + 1).toString();
        btn.dataset.question = i.toString();

        if (this.state.answers[i]) btn.classList.add('attempted');
        if (this.state.flagged.has(i)) btn.classList.add('flagged');
        if (i === this.state.currentQuestion) btn.classList.add('current');

        btn.addEventListener('click', () => {
          this.goToQuestion(i);
          this.hideReviewModal();
        });

        gridEl.appendChild(btn);
      }
    }

    modal.style.display = 'block';
  }

  private hideReviewModal(): void {
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private savePracticeResult(result: any): void {
    try {
      const existingHistory = localStorage.getItem('practice_history');
      const history = existingHistory ? JSON.parse(existingHistory) : { results: [] };
      
      history.results.unshift(result);
      
      // Keep only last 50 results
      if (history.results.length > 50) {
        history.results = history.results.slice(0, 50);
      }
      
      localStorage.setItem('practice_history', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save practice result:', error);
    }
  }
}

// Initialize practice manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Practice mode initializing...');
  const practiceManager = new PracticeManager();
  practiceManager.init();
});

// Make classes available globally if needed
window.PracticeManager = PracticeManager;
window.PracticeTimer = PracticeTimer;
