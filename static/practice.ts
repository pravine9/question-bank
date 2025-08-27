// Practice Mode Logic - Full Implementation

import type {
  Question,
  PracticeState,
  PracticeResult,
} from '@/types/question';
import { formatBankName } from '@/utils/bankNames';
import { EMPTY_HISTORY } from '@/utils/history';
import { evaluateAnswer, getCorrectAnswerText, formatExplanation } from '@/utils/answers';
import { PracticeTestTimer, showTimerWarning, type TimerWarning } from '@/utils/timer';
import { banks } from './banks';
import { questionRenderer } from './question_renderer';
import { QuestionStatisticsComponent } from '../src/components/questionStatistics';

// Make utility functions globally available for questionRenderer
(window as any).evaluateAnswer = evaluateAnswer;
(window as any).getCorrectAnswerText = getCorrectAnswerText;
(window as any).formatExplanation = formatExplanation;

// Practice test with timer functionality - countdown based on question count

export class PracticeManager {
  private state: PracticeState | null = null;
  private isFinished: boolean = false;
  private sessionKey: string = '';
  private timer: PracticeTestTimer | null = null;
  private timerDisplayElement: HTMLElement | null = null;
  private questionStatsComponent: QuestionStatisticsComponent;
  private timeUpTriggered: boolean = false;

  constructor() {
    this.timerDisplayElement = document.getElementById('timerValue');
    this.questionStatsComponent = new QuestionStatisticsComponent(banks);
  }

  init(): void {
    const params = new URLSearchParams(window.location.search);
    const bank = params.get('bank');
    const numQuestions = parseInt(params.get('num') || '10');
    const resume = params.get('resume') === 'true';

    if (!bank || !banks || !banks[bank]) {
      alert('No valid question bank selected');
      window.location.href = 'index.html';
    return;
  }
  
    this.sessionKey = `practice_session_${bank}_${numQuestions}`;
    
    // Try to resume existing session
    if (resume || this.loadExistingSession()) {
      console.log('Resuming existing practice session');
    } else {
      this.setupPracticeSession(bank, numQuestions);
    }
    
    this.setupEventListeners();
    this.renderCurrentQuestion();
    
    // Add auto-save and cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.saveSession();
      if (this.timer) {
        this.timer.destroy();
      }
    });
  }

  private setupPracticeSession(bank: string, numQuestions: number): void {
    const bankData = banks[bank];
    if (!bankData || !bankData.length) {
      alert('Question bank is empty');
    return;
  }
  
    // Validate numQuestions
    if (numQuestions <= 0 || numQuestions > 100) {
      alert('Invalid number of questions. Using default of 10.');
      numQuestions = 10;
    }

    // Flatten all questions from all files in the bank
    const allQuestions: Question[] = [];
    bankData.forEach((questionArray: Question[]) => {
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
      titleEl.textContent = `${formatBankName(bank)} - ${selectedQuestions.length} Questions`;
    }

    this.setupNavigation();
    this.updateProgress();
    this.initializeTimer();
  }

  private setupNavigation(): void {
    if (!this.state) {return;}

    const nav = document.querySelector('.sidebar .nav');
    if (!nav) {return;}

    nav.innerHTML = '';
    for (let i = 0; i < this.state.totalQuestions; i++) {
      const li = document.createElement('li');
      li.dataset.question = i.toString();
      li.textContent = (i + 1).toString();
      nav.appendChild(li);
    }

    // Add click handlers
    nav.addEventListener('click', (e) => {
      const li = (e.target as HTMLElement).closest('li') as HTMLLIElement;
      if (li && li.dataset.question) {
        const questionNum = parseInt(li.dataset.question);
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
      checkBtn.addEventListener('click', () => this.toggleCheck());
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
    if (!this.state || this.state.currentQuestion >= this.state.questions.length) {return;}

    const question = this.state.questions[this.state.currentQuestion];
    
    // Update question number
    const qNumEl = document.querySelector('.q-number');
    if (qNumEl) {
      qNumEl.textContent = `Question ${this.state.currentQuestion + 1}`;
    }

    // Render question using global renderer
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
        explanation: '#explanation'
      });
    }

    // Restore saved answer
    const savedAnswer = this.state.answers[this.state.currentQuestion];
    if (savedAnswer) {
      if (question.is_calculation) {
        const input = document.getElementById('calcInput') as HTMLInputElement;
        if (input) {input.value = savedAnswer;}
      } else {
        const radio = document.querySelector(`input[name="answer"][value="${savedAnswer}"]`) as HTMLInputElement;
        if (radio) {
          radio.checked = true;
          // Also update the visual selected state
          const label = radio.closest('label');
          if (label) {
            label.classList.add('selected');
          }
        }
      }
    }

    // Update flag icon visibility
    const questionFlag = document.getElementById('questionFlag');
    if (questionFlag) {
      if (this.state.flagged.has(this.state.currentQuestion)) {
        questionFlag.style.display = 'inline';
      } else {
        questionFlag.style.display = 'none';
      }
    }

    // Reset feedback elements and button states when moving to a new question
    this.resetFeedbackAndButtons();

    this.updateNavigation();
    this.updateProgress();
    this.saveSession(); // Auto-save on question change
  }

  private saveAnswer(): void {
    if (!this.state) {return;}

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
      this.updateProgress();
      this.saveSession(); // Auto-save when answer changes
    } else {
      // If answer is empty, remove it from answers
      delete this.state.answers[this.state.currentQuestion];
      this.updateNavigation();
      this.updateProgress();
      this.saveSession(); // Auto-save when answer changes
    }
    
    // Reset feedback and buttons when answer changes (only if currently showing feedback)
    if (questionRenderer) {
      const currentState = questionRenderer.getCurrentDisplayState();
      if (currentState !== 'hidden') {
        const question = this.state.questions[this.state.currentQuestion];
        questionRenderer.displayAnswer(question, 'hide');
      }
    }
  }

  private updateProgress(): void {
    if (!this.state) {return;}

    const progressBar = document.querySelector('.progress .bar') as HTMLElement;
    const answeredCount = Object.keys(this.state.answers).length;
    const progress = (answeredCount / this.state.totalQuestions) * 100;

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  private updateNavigation(): void {
    if (!this.state) {return;}

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
    const navItems = document.querySelectorAll('.sidebar .nav li');
    navItems.forEach((item, index) => {
      const li = item as HTMLLIElement;
      li.classList.remove('active', 'answered', 'flagged');
      
      // Set base content with flag icon if flagged
      const questionNumber = index + 1;
      if (this.state!.flagged.has(index)) {
        li.innerHTML = `${questionNumber} <span class="flag-btn">⚑</span>`;
        li.classList.add('flagged');
      } else {
        li.textContent = questionNumber.toString();
      }
      
      if (index === this.state!.currentQuestion) {
        li.classList.add('active');
      }
      if (this.state!.answers[index]) {
        li.classList.add('answered');
      }
    });
  }

  private goToQuestion(questionNum: number): void {
    if (!this.state || questionNum < 0 || questionNum >= this.state.totalQuestions) {return;}

    this.state.currentQuestion = questionNum;
    this.renderCurrentQuestion();
  }

  private previousQuestion(): void {
    if (!this.state || this.state.currentQuestion <= 0) {return;}
    this.goToQuestion(this.state.currentQuestion - 1);
  }

  private nextQuestion(): void {
    if (!this.state || this.state.currentQuestion >= this.state.totalQuestions - 1) {return;}
    this.goToQuestion(this.state.currentQuestion + 1);
  }

  private toggleFlag(): void {
    if (!this.state) {return;}

    const questionNum = this.state.currentQuestion;
    const questionFlag = document.getElementById('questionFlag');
    
    if (this.state.flagged.has(questionNum)) {
      this.state.flagged.delete(questionNum);
      if (questionFlag) {
        questionFlag.style.display = 'none';
      }
    } else {
      this.state.flagged.add(questionNum);
      if (questionFlag) {
        questionFlag.style.display = 'inline';
      }
    }

    this.updateNavigation();
    this.saveSession(); // Auto-save when flag changes
  }

  private toggleCheck(): void {
    if (!this.state || !questionRenderer) {
      return;
    }
    
    const question = this.state.questions[this.state.currentQuestion];
    const userAnswer = this.state.answers[this.state.currentQuestion];
    const currentState = questionRenderer.getCurrentDisplayState();
    
    if (currentState === 'checked') {
      questionRenderer.displayAnswer(question, 'hide');
    } else {
      questionRenderer.displayAnswer(question, 'check', userAnswer);
      
      // Record statistics when user checks their answer
      if (userAnswer) {
        const questionId = question.id.toString();
        const isCorrect = evaluateAnswer(question, userAnswer);
        this.questionStatsComponent.recordQuestionAttempt(this.state.bank, questionId, isCorrect);
      }
    }
  }



  private resetFeedbackAndButtons(): void {
    if (!questionRenderer) {
      return;
    }
    
    // The questionRenderer will handle all the cleanup and button state management
    const dummyQuestion = { id: 0 } as Question; // Just for the interface, not actually used
    questionRenderer.displayAnswer(dummyQuestion, 'hide');
  }

  private finishTest(): void {
    if (!this.state) {return;}

    const answeredCount = Object.keys(this.state.answers).length;
    const unanswered = this.state.totalQuestions - answeredCount;

    if (unanswered > 0) {
      const confirm = window.confirm(
        `You have ${unanswered} unanswered questions. Are you sure you want to finish the test?`
      );
      if (!confirm) {return;}
    }

    this.calculateResults();
    this.clearSession(); // Clear session when test is completed
    this.showSummary();
  }

  private initializeTimer(remainingSeconds?: number): void {
    if (!this.state) {
      return;
    }

    // Clean up existing timer if any
    if (this.timer) {
      this.timer.destroy();
      this.timer = null;
    }

    // Create timer with callbacks
    this.timer = new PracticeTestTimer(this.state.totalQuestions, {
      onUpdate: () => this.updateTimerDisplay(),
      onWarning: (warning) => this.handleTimerWarning(warning),
      onComplete: () => this.handleTimeUp()
    });

    // Start timer with remaining time if provided (for session restoration)
    if (remainingSeconds !== undefined && remainingSeconds > 0) {
      // Calculate elapsed time and adjust start time
      const totalSeconds = this.state.totalQuestions * 3 * 60;
      const elapsedSeconds = totalSeconds - remainingSeconds;
      this.state.startTime = Date.now() - (elapsedSeconds * 1000);
      
      // Start timer with exact remaining time
      this.timer.startWithTime(remainingSeconds);
    } else {
      // Start fresh timer
      this.timer.start();
    }

    // Failsafe: Check if timer should have already expired
    this.checkTimerExpiry();
  }

  private checkTimerExpiry(): void {
    if (!this.state || !this.timer) {
      return;
    }

    // Failsafe: Check if test should have already ended based on elapsed time
    const elapsedMs = Date.now() - this.state.startTime;
    const totalTimeMs = this.state.totalQuestions * 3 * 60 * 1000;
    
    if (elapsedMs >= totalTimeMs) {
      console.warn('Timer failsafe triggered - test time has expired');
      this.handleTimeUp();
    }
  }

  private updateTimerDisplay(): void {
    if (!this.timerDisplayElement || !this.timer) {
      return;
    }

    try {
      const formattedTime = this.timer.getFormattedTime();
      this.timerDisplayElement.textContent = formattedTime;

      // Update timer display styling based on remaining time
      const remainingSeconds = this.timer.getTotalRemainingSeconds();
      const timerDisplay = document.getElementById('timerDisplay');
      
      // Failsafe: Check for negative time (shouldn't happen but just in case)
      if (remainingSeconds < 0) {
        console.warn('Timer display failsafe: Negative time detected, triggering completion');
        this.handleTimeUp();
        return;
      }
      
      if (timerDisplay) {
        // Remove existing warning classes
        timerDisplay.classList.remove('warning', 'critical');
        
        // Add appropriate warning class
        if (remainingSeconds <= 60) { // Last minute
          timerDisplay.classList.add('critical');
        } else if (remainingSeconds <= 300) { // Last 5 minutes
          timerDisplay.classList.add('warning');
        }
      }
    } catch (error) {
      console.error('Error updating timer display:', error);
      // Failsafe: Show a generic timer display if specific formatting fails
      if (this.timerDisplayElement) {
        this.timerDisplayElement.textContent = '00:00';
      }
    }
  }

  private handleTimerWarning(warning: TimerWarning): void {
    // Show unintrusive warning notification
    showTimerWarning(warning);
  }

  private handleTimeUp(): void {
    if (!this.state || this.timeUpTriggered) {
      return; // Prevent multiple time-up events
    }

    // Mark time up as triggered to prevent duplicates
    this.timeUpTriggered = true;

    // Stop any ongoing actions
    this.isFinished = true;

    // Clean up timer
    if (this.timer) {
      this.timer.destroy();
      this.timer = null;
    }

    // Show time up notification
    const timeUpModal = this.createTimeUpModal();
    document.body.appendChild(timeUpModal);
  }

  private createTimeUpModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'time-up-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      font-family: 'Nunito', sans-serif;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h2');
    title.textContent = '⏰ Time\'s Up!';
    title.style.cssText = `
      color: #e74c3c;
      margin: 0 0 20px 0;
      font-size: 28px;
    `;

    const message = document.createElement('p');
    message.textContent = 'Your practice test time has expired. You can still review your answers or finish the test now.';
    message.style.cssText = `
      color: #555;
      margin: 0 0 30px 0;
      line-height: 1.5;
      font-size: 16px;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 15px;
      justify-content: center;
    `;

    const finishButton = document.createElement('button');
    finishButton.textContent = 'Finish Test';
    finishButton.className = 'btn btn-danger';
    finishButton.style.cssText = `
      padding: 12px 24px;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background: #e74c3c;
      color: white;
    `;
    finishButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.finishTest();
    });

    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continue Review';
    continueButton.className = 'btn btn-secondary';
    continueButton.style.cssText = `
      padding: 12px 24px;
      font-weight: 600;
      border: 1px solid #ccc;
      border-radius: 6px;
      cursor: pointer;
      background: white;
      color: #555;
    `;
    continueButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    buttonContainer.appendChild(finishButton);
    buttonContainer.appendChild(continueButton);

    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modalContent.appendChild(buttonContainer);
    modal.appendChild(modalContent);

    return modal;
  }

  private calculateResults(): void {
    if (!this.state) {return;}

    let correctCount = 0;
    const duration = Math.floor((Date.now() - this.state.startTime) / 60000); // Calculate elapsed minutes

    // Check answers
    for (let i = 0; i < this.state.questions.length; i++) {
      const question = this.state.questions[i];
      const userAnswer = this.state.answers[i];
      
      if (userAnswer && evaluateAnswer(question, userAnswer)) {
        correctCount++;
      }
    }

    const score = Math.round((correctCount / this.state.totalQuestions) * 100);
    const resultId = Date.now().toString();

    // Save complete test result to history
    this.savePracticeResult({
      id: resultId,
      bank: this.state.bank,
      totalQuestions: this.state.totalQuestions,
      correctAnswers: correctCount,
      score,
      duration,
      date: new Date().toISOString(),
      flaggedQuestions: this.state.flagged.size,
      questions: this.state.questions,
      answers: this.state.answers,
      flagged: Array.from(this.state.flagged)
    } as PracticeResult);

    this.isFinished = true;
    
    // Redirect to summary page
    window.location.href = `summary.html?resultId=${resultId}`;
  }

  private showSummary(): void {
    // This method is no longer needed as we redirect to a separate summary page
    // The summary functionality is now handled by summary.ts
  }


  private showReviewModal(): void {
    if (!this.state) {return;}

    const modal = document.getElementById('reviewModal');
    if (!modal) {return;}

    // Setup filter functionality
    this.setupFilterHandlers();

    // Generate question grid
    this.updateQuestionGrid();

    modal.style.display = 'block';
  }

  private setupFilterHandlers(): void {
    const filterUnattempted = document.getElementById('filterUnattempted') as HTMLInputElement;
    const filterAttempted = document.getElementById('filterAttempted') as HTMLInputElement;
    const filterFlagged = document.getElementById('filterFlagged') as HTMLInputElement;
    const clearBtn = document.querySelector('.clear-filter-btn') as HTMLButtonElement;

    if (filterUnattempted) {
      filterUnattempted.addEventListener('change', () => this.updateQuestionGrid());
    }
    if (filterAttempted) {
      filterAttempted.addEventListener('change', () => this.updateQuestionGrid());
    }
    if (filterFlagged) {
      filterFlagged.addEventListener('change', () => this.updateQuestionGrid());
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
  }

  private clearFilters(): void {
    const filterUnattempted = document.getElementById('filterUnattempted') as HTMLInputElement;
    const filterAttempted = document.getElementById('filterAttempted') as HTMLInputElement;
    const filterFlagged = document.getElementById('filterFlagged') as HTMLInputElement;

    if (filterUnattempted) {
      filterUnattempted.checked = false;
    }
    if (filterAttempted) {
      filterAttempted.checked = false;
    }
    if (filterFlagged) {
      filterFlagged.checked = false;
    }

    this.updateQuestionGrid();
  }

  private updateQuestionGrid(): void {
    if (!this.state) {return;}

    const filterUnattempted = document.getElementById('filterUnattempted') as HTMLInputElement;
    const filterAttempted = document.getElementById('filterAttempted') as HTMLInputElement;
    const filterFlagged = document.getElementById('filterFlagged') as HTMLInputElement;

    const gridEl = document.getElementById('questionGridReview');
    if (!gridEl) {return;}

    gridEl.innerHTML = '';

    for (let i = 0; i < this.state.totalQuestions; i++) {
      const isAttempted = !!this.state.answers[i];
      const isFlagged = this.state.flagged.has(i);
      const isCurrent = i === this.state.currentQuestion;

      // Check if question should be shown based on filters
      // If no filters are selected, show all questions
      const hasActiveFilters = (filterUnattempted?.checked || filterAttempted?.checked || filterFlagged?.checked);
      
      let shouldShow = false;
      
      if (!hasActiveFilters) {
        // If no filters are selected, show all questions
        shouldShow = true;
      } else {
        // Apply selected filters
        if (isAttempted && filterAttempted?.checked) {
          shouldShow = true;
        }
        if (!isAttempted && filterUnattempted?.checked) {
          shouldShow = true;
        }
        if (isFlagged && filterFlagged?.checked) {
          shouldShow = true;
        }
      }

      if (!shouldShow) {
        continue;
      }

      const btn = document.createElement('button');
      btn.className = 'grid-item';
      btn.dataset.question = i.toString();

      // Set base content with flag icon if flagged (consistent with sidebar navigation)
      const questionNumber = i + 1;
      if (isFlagged) {
        btn.innerHTML = `${questionNumber} <span class="flag-btn">⚑</span>`;
        btn.classList.add('flagged');
      } else {
        btn.textContent = questionNumber.toString();
      }

      if (isAttempted) {
        btn.classList.add('answered'); // Use 'answered' to match sidebar navigation
      }
      if (isCurrent) {
        btn.classList.add('active'); // Use 'active' to match sidebar navigation
      }

      btn.addEventListener('click', () => {
        this.goToQuestion(i);
        this.hideReviewModal();
      });

      gridEl.appendChild(btn);
    }
  }

  private hideReviewModal(): void {
    const modal = document.getElementById('reviewModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  private savePracticeResult(result: PracticeResult): void {
    try {
      const existingHistory = localStorage.getItem('practice_history');
      const history = existingHistory ? JSON.parse(existingHistory) : { ...EMPTY_HISTORY };
      
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

  private saveSession(): void {
    if (!this.state || this.isFinished) {
      return;
    }
    
    try {
      // Calculate remaining time for timer persistence
      let remainingSeconds = 0;
      if (this.timer && this.timer.isRunning()) {
        remainingSeconds = this.timer.getTotalRemainingSeconds();
      } else {
        // Fallback calculation if timer is not running
        const elapsedMs = Date.now() - this.state.startTime;
        const totalTimeMs = this.state.totalQuestions * 3 * 60 * 1000; // 3 minutes per question
        remainingSeconds = Math.max(0, Math.floor((totalTimeMs - elapsedMs) / 1000));
      }

      const sessionData = {
        currentQuestion: this.state.currentQuestion,
        answers: this.state.answers,
        flagged: Array.from(this.state.flagged),
        startTime: this.state.startTime,
        bank: this.state.bank,
        totalQuestions: this.state.totalQuestions,
        questions: this.state.questions.map((q: Question) => q.id), // Store only IDs to save space
        timestamp: Date.now(),
        remainingSeconds: remainingSeconds, // Save timer state
        timerActive: this.timer ? this.timer.isRunning() : true
      };
      
      sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
      console.log('Session saved:', this.sessionKey);
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  private loadExistingSession(): boolean {
    try {
      const sessionData = sessionStorage.getItem(this.sessionKey);
      if (!sessionData) {
        return false;
      }
      
      const data = JSON.parse(sessionData);
      
      // Check if session is too old (more than 24 hours)
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        sessionStorage.removeItem(this.sessionKey);
        return false;
      }
      
      // Reconstruct questions from IDs
    const bankData = banks[data.bank];
      const allQuestions: Question[] = [];
      bankData.forEach((questionArray: Question[]) => {
        allQuestions.push(...questionArray);
      });
      
        const questions = data.questions
          .map((id: number) => allQuestions.find((q: Question) => q.id === id))
          .filter((q: Question | undefined): q is Question => q !== undefined);
      
      if (questions.length !== data.totalQuestions) {
        console.warn('Question mismatch, starting new session');
        return false;
      }
      
      this.state = {
        currentQuestion: data.currentQuestion,
        questions: questions,
        answers: data.answers || {},
        flagged: new Set(data.flagged || []),
        startTime: data.startTime,
        bank: data.bank,
        totalQuestions: data.totalQuestions
      };
      
      // Update UI
      const titleEl = document.querySelector('.test-title');
      if (titleEl) {
        titleEl.textContent = `${formatBankName(data.bank)} - ${questions.length} Questions`;
      }
      
      this.setupNavigation();
      
      // Restore timer with saved remaining time
      const savedRemainingSeconds = data.remainingSeconds;
      const timerWasActive = data.timerActive !== false; // Default to true if not saved
      
      if (timerWasActive && savedRemainingSeconds > 0) {
        this.initializeTimer(savedRemainingSeconds);
      } else if (savedRemainingSeconds <= 0) {
        // Timer had expired, trigger time up immediately
        this.handleTimeUp();
      } else {
        // Initialize fresh timer as fallback
        this.initializeTimer();
      }
      
      console.log('Session loaded successfully');
      return true;
    } catch (error) {
      console.warn('Failed to load session:', error);
      return false;
    }
  }

  private clearSession(): void {
    try {
      sessionStorage.removeItem(this.sessionKey);
      console.log('Session cleared:', this.sessionKey);
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
    
    // Clean up timer
    if (this.timer) {
      this.timer.destroy();
      this.timer = null;
    }
  }

}

